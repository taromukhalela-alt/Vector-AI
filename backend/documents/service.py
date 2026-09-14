import hashlib
import logging
from concurrent.futures import ThreadPoolExecutor

from .processing import content_to_ir
from .renderers import ReportLabRenderer, validate_pdf

logger = logging.getLogger(__name__)

try:
    from backend.pdf.renderer import StyledPdfRenderer
    _DEFAULT_RENDERER = StyledPdfRenderer()
except Exception:
    _DEFAULT_RENDERER = None



class ContentHasher:
    """Stable hash boundary; can be replaced by a tenant/content service."""

    def digest(self, title, content, theme):
        return hashlib.sha256(
            ("%s\0%s\0%s" % (title, content, theme)).encode("utf-8")
        ).hexdigest()


class DocumentService:
    def __init__(self, app, storage, renderer=None, db=None, model=None, hasher=None):
        self.app = app
        self.storage = storage
        self.renderer = renderer or _DEFAULT_RENDERER or ReportLabRenderer()
        self.db = db
        self.model = model
        self.hasher = hasher or ContentHasher()
        self.executor = ThreadPoolExecutor(max_workers=2)

    @staticmethod
    def content_hash(title, content, theme):
        return ContentHasher().digest(title, content, theme)

    def enqueue(self, record, title, content, theme, metadata):
        digest = self.hasher.digest(title, content, theme)
        record.content_hash, record.status = digest, "queued"
        self.db.session.commit()
        # SQLite in-memory databases use a connection-local database. Running
        # inline keeps test/dev configurations deterministic; real deployments
        # retain the non-blocking worker path.
        database_uri = str(self.app.config.get("SQLALCHEMY_DATABASE_URI", ""))
        if ":memory:" in database_uri:
            self._generate(record.id, title, content, theme, metadata)
        else:
            self.executor.submit(self._generate, record.id, title, content, theme, metadata)

    def resume_pending(self):
        """Requeue work left behind by a process restart."""
        if self.db is None or self.model is None:
            return
        with self.app.app_context():
            records = self.model.query.filter(
                self.model.status.in_(["queued", "processing"])
            ).all()
            for record in records:
                record.status = "queued"
            if records:
                self.db.session.commit()
            for record in records:
                args = (
                    record.id, record.title, record.content or "",
                    record.theme, record.metadata_json or {},
                )
                if ":memory:" in str(self.app.config.get("SQLALCHEMY_DATABASE_URI", "")):
                    self._generate(*args)
                else:
                    self.executor.submit(self._generate, *args)

    def _generate(self, record_id, title, content, theme, metadata):
        generated_path = None
        with self.app.app_context():
            try:
                # Claim queued work atomically so startup recovery and multiple
                # web workers cannot render the same document concurrently.
                claimed = self.model.query.filter_by(
                    id=record_id, status="queued"
                ).update({"status": "processing"}, synchronize_session=False)
                if not claimed:
                    return
                self.db.session.commit()
                document = content_to_ir(title, content, theme, metadata)
                pdf = self.renderer.render(document)
                validate_pdf(pdf)
                generated_path = self.storage.save(record_id, pdf)
                record = self.db.session.get(self.model, record_id)
                if record:
                    record.status, record.storage_path = "completed", generated_path
                    self.db.session.commit()
                else:
                    self.storage.delete(generated_path)
            except Exception as exc:
                self.db.session.rollback()
                if generated_path:
                    try:
                        self.storage.delete(generated_path)
                    except (OSError, ValueError):
                        pass
                record = self.db.session.get(self.model, record_id)
                if record:
                    record.status, record.error = "failed", str(exc)[:1000]
                    self.db.session.commit()
