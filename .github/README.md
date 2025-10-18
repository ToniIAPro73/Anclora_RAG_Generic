# CI/CD Pipeline - Anclora RAG Generic

## Overview

This repository uses GitHub Actions for continuous integration and deployment. The CI/CD pipeline ensures code quality, runs automated tests, and validates that all changes work correctly before merging.

## Workflows

### CI - Tests and Linting (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `master`, `main`, or `develop` branches
- Pull requests targeting `master`, `main`, or `develop`

**Jobs:**

#### 1. Backend Tests (`backend-tests`)
- **Runtime**: Ubuntu Latest
- **Services**: Postgres 16, Qdrant v1.7.4, Redis 7
- **Python Version**: 3.11
- **Steps**:
  1. Checkout code
  2. Setup Python with pip caching
  3. Install dependencies (pytest, pytest-cov, ruff)
  4. Lint with ruff (Python linter)
  5. Run pytest with coverage
  6. Upload coverage to Codecov

**Environment Variables**:
```yaml
DATABASE_URL: postgresql://anclora_user:anclora_test_pass@localhost:5432/anclora_rag_test
QDRANT_URL: http://localhost:6333
REDIS_URL: redis://localhost:6379
AUTH_BYPASS: true  # For testing without authentication
APP_ENV: test
LOG_LEVEL: WARNING
```

**Coverage Report**:
- Generated with `pytest --cov`
- Uploaded to Codecov for tracking over time
- Shows line-by-line coverage in terminal

#### 2. Frontend Tests (`frontend-tests`)
- **Runtime**: Ubuntu Latest
- **Node Version**: 20
- **Steps**:
  1. Checkout code
  2. Setup Node.js with npm caching
  3. Install dependencies with `npm ci`
  4. Run ESLint for code quality
  5. Type check with TypeScript
  6. Build Next.js application

**Key Checks**:
- ESLint rules enforcement
- TypeScript type safety
- Next.js build succeeds
- No TypeScript errors (soft fail)

#### 3. Integration Tests (`integration-tests`)
- **Dependencies**: Runs after backend and frontend tests pass
- **Runtime**: Ubuntu Latest
- **Steps**:
  1. Checkout code
  2. Setup Docker Buildx
  3. Start services with Docker Compose
  4. Health check all services
  5. Tear down services

**Services Tested**:
- Postgres (port 5462)
- Qdrant (port 6363)
- Redis (port 6389)

---

## Running Tests Locally

### Backend Tests

```bash
# Navigate to API directory
cd apps/api

# Install dependencies
pip install -r requirements.txt
pip install pytest pytest-cov ruff

# Run tests with coverage
pytest -v --cov=. --cov-report=xml --cov-report=term-missing

# Lint code
ruff check .
```

### Frontend Tests

```bash
# Navigate to web directory
cd apps/web

# Install dependencies
npm install

# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build
```

### Integration Tests

```bash
# From project root
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres qdrant redis

# Wait for services
sleep 10

# Health checks
curl http://localhost:6363/health
docker exec $(docker ps -qf "name=postgres") pg_isready

# Tear down
docker compose -f infra/docker/docker-compose.dev.yml down -v
```

---

## Test Coverage

### Current Coverage (as of 2025-10-17)

- **Backend**: 75.76% (25/33 tests passing)
- **Frontend**: Lint passing, type checks enabled
- **Integration**: Docker services health checks

### Coverage Goals

- Backend: 80%+ line coverage
- Frontend: 70%+ test coverage (when tests are added)
- Integration: 100% service availability

---

## Adding New Tests

### Backend (Pytest)

1. Create test file in `apps/api/tests/test_*.py`
2. Use fixtures from `conftest.py`
3. Follow naming convention: `test_<feature>_<scenario>()`
4. Mark tests with `@pytest.mark.unit` or `@pytest.mark.integration`

Example:
```python
@pytest.mark.unit
def test_new_feature(client: TestClient):
    response = client.get("/new-endpoint")
    assert response.status_code == 200
```

### Frontend (Future: Jest/Vitest)

1. Create `*.test.tsx` files next to components
2. Use React Testing Library
3. Test user interactions, not implementation

---

## Continuous Deployment (Future)

### Planned Workflows

1. **Deploy to Staging**
   - Trigger: Merge to `develop`
   - Deploy to staging environment
   - Run smoke tests

2. **Deploy to Production**
   - Trigger: Tag with `v*` (e.g., `v1.0.0`)
   - Deploy to production
   - Run full end-to-end tests
   - Rollback on failure

### Pre-requisites for CD

- [ ] Setup staging environment
- [ ] Setup production environment
- [ ] Configure secrets in GitHub
- [ ] Create deployment scripts
- [ ] Implement smoke tests
- [ ] Configure rollback mechanism

---

## Secrets Configuration

When setting up CI/CD on GitHub, configure these secrets:

```
CODECOV_TOKEN           # For coverage uploads
DOCKER_USERNAME         # For Docker registry (if using)
DOCKER_PASSWORD         # For Docker registry (if using)
```

---

## Troubleshooting

### Tests Failing in CI but Passing Locally

1. **Check environment variables** - CI uses different values
2. **Verify service connections** - Ports may differ
3. **Review logs** - GitHub Actions provides detailed output

### Qdrant Connection Issues

- Service may take time to start - add `sleep 10` before tests
- Verify health check endpoint: `http://localhost:6333/health`
- Check Qdrant version compatibility

### Coverage Upload Failures

- Ensure `CODECOV_TOKEN` secret is configured
- Check that `coverage.xml` is generated correctly
- Review Codecov action version

---

## Best Practices

1. **Always run tests locally** before pushing
2. **Keep tests fast** - use mocks for external services
3. **Write descriptive test names** - explain what is being tested
4. **Update CI when adding dependencies** - keep `requirements.txt` and `package.json` in sync
5. **Monitor coverage trends** - aim for incremental improvement

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Pytest Documentation](https://docs.pytest.org/)
- [Codecov Documentation](https://docs.codecov.com/)
- [ESLint Documentation](https://eslint.org/docs/latest/)

---

**Last Updated**: 2025-10-17
**Maintained by**: Anclora Team
