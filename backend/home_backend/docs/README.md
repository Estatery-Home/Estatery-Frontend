# API documentation

Generated OpenAPI 3 schema and interactive docs for the Django backend.

## Interactive (with server running)

After `python manage.py runserver`, open:

- **Swagger UI:** [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **ReDoc:** [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/)
- **Raw OpenAPI JSON:** [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

Use **Authorize** in Swagger UI and paste `Bearer <your_access_token>` for protected routes.

## Static export

Regenerate the committed schema file:

```bash
cd home_backend
python manage.py spectacular --file docs/openapi.yaml
```

**Editor support:** the workspace recommends [42Crunch OpenAPI](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi) and Red Hat YAML (see `Home_New/.vscode/extensions.json` in the project root) for navigation, validation, and preview of `docs/openapi.yaml`.
