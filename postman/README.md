# Order Module Postman Automation

This folder contains an enterprise-level Postman collection for the Spring Boot Order Management module.

## Files

- `OrderModule.enterprise.postman_collection.json` - full collection with JWT, role, validation, pagination, sorting, filtering, chained requests, and schema checks.
- `OrderModule.enterprise.postman_environment.json` - local environment template.
- `OrderModule.runner-data.json` - data-driven runner scenarios for positive, negative, and boundary create-order cases.

## Required Environment Variables

- `baseUrl` - API base URL, for example `http://localhost:8080`
- `customerToken` - JWT for a CUSTOMER user
- `adminToken` - JWT for an ADMIN user
- `shipperToken` - JWT for a SHIPPER user
- `invalidToken` - intentionally invalid JWT value for negative tests
- `customerId`, `shipperId`, `orderId`, `orderCode`, `assignmentId` - optional dynamic values populated during execution

## Postman Runner

1. Import the collection JSON.
2. Import the environment JSON.
3. Select the environment.
4. Run folder `00 Auth Bootstrap (Optional)` first to auto-generate `customerToken`, `adminToken`, and `shipperToken`.
5. Run the full collection with the Runner.
6. Optionally attach `OrderModule.runner-data.json` to drive create-order scenarios.

## Recommended Execution Order

1. `00 Auth Bootstrap (Optional)`
2. `00 Security & JWT`
3. `01 Customer Orders`
4. `02 Admin Orders`
5. `03 Shipper Assignment`

This order ensures `orderId`, `orderCode`, and `assignmentId` are chained and reused by downstream requests.

## Newman CLI

Run the full suite locally:

```bash
npm install
npm run postman:order
```

The Newman JUnit report is exported to `postman/order-module-junit.xml`.

## CI/CD

Use the GitHub Actions workflow under `.github/workflows/postman-order-module.yml`.
Provide repository secrets or variables for:

- `BASE_URL`
- `CUSTOMER_TOKEN`
- `ADMIN_TOKEN`
- `SHIPPER_TOKEN`
- `INVALID_TOKEN`

## Notes

- The collection validates the current response envelope:
  - `success`
  - `message`
  - `data`
- The collection includes extra negative tests for order creation:
  - missing token
  - invalid payment method
- Pagination and sorting tests are intentionally strict. If the backend ignores `page` or `size`, the tests will surface that as a defect.
- Some security checks use a missing or invalid JWT. Role-based tests are wired for customer, admin, and shipper tokens.
