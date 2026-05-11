# Users Feed Service

The `UsersFeedService` is a development-only service that automatically loads mock users into the database for testing and development purposes.

## Features

- **Automatic Initialization**: Automatically feeds users to the database on startup if no users exist
- **Manual Control**: Provides endpoints to manually trigger user feeding operations
- **Database Integration**: Uses the actual `UserRepository` to persist users to the database
- **Dev Profile Only**: Only runs in development mode (`@Profile("dev")`)

## Mock Users Included

The service creates the following mock users:

| Email | First Name | Last Name | Role |
|-------|------------|-----------|------|
| admin@produs.com | Admin | User | ADMIN |
| owner@produs.com | Product | Owner | PRODUCT_OWNER |
| team@produs.com | Team | Manager | TEAM_MANAGER |
| specialist@produs.com | Service | Specialist | SPECIALIST |
| advisor@produs.com | Platform | Advisor | ADVISOR |

## API Endpoints

All endpoints are available under `/api/mock/feed/` and require dev profile:

### Feed Users to Database
```http
POST /api/mock/feed/users
```
Loads all mock users into the database.

### Feed Users if Empty
```http
POST /api/mock/feed/users/if-empty
```
Loads mock users into database only if no users exist.

### Clear All Users
```http
DELETE /api/mock/feed/users
```
⚠️ **Warning**: Removes all users from the database. Use with caution.

### Get Database Status
```http
GET /api/mock/feed/status
```
Returns information about users in the database:
```json
{
  "hasUsers": true,
  "totalUsers": 5,
  "adminUsers": 1,
  "productOwnerUsers": 1,
  "teamManagerUsers": 1,
  "specialistUsers": 1,
  "advisorUsers": 1
}
```

## Usage Examples

### Check Database Status
```bash
curl -X GET http://localhost:8080/api/mock/feed/status
```

### Feed Users to Database
```bash
curl -X POST http://localhost:8080/api/mock/feed/users
```

### Feed Users Only if Database is Empty
```bash
curl -X POST http://localhost:8080/api/mock/feed/users/if-empty
```

### Clear All Users (Use with Caution)
```bash
curl -X DELETE http://localhost:8080/api/mock/feed/users
```

## Integration with MockUserService

The `UsersFeedService` works alongside the existing `MockUserService`:

- **MockUserService**: Provides in-memory mock users for authentication testing
- **UsersFeedService**: Loads persistent mock users into the database for data testing

Both services use the same mock user data for consistency.

## Configuration

The service is automatically enabled when running with the `dev` profile:

```yaml
spring:
  profiles:
    active: dev
```

## Database Schema

Users are persisted with the following structure:
- `id`: UUID (auto-generated)
- `email`: Unique email address
- `first_name`: User's first name
- `last_name`: User's last name
- `role`: User role (ADMIN, PRODUCT_OWNER, TEAM_MANAGER, SPECIALIST, ADVISOR)
- `supabase_id`: Mock Supabase ID for compatibility
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Logging

The service provides detailed logging:
- Info level: Service initialization and major operations
- Debug level: Individual user creation details
- Warn level: Clear operations and potential issues
- Error level: Operation failures
