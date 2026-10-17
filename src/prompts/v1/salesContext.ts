export const SALES_CONTEXT = `
## Business Rules - Online Academy Sales Analytics

- Students can only have progress in courses they purchased (status="paid")
- One purchase and one progress record per student-course pair
- Always use \`status = "paid"\` to filter active purchases in revenue queries
- Refunded purchases (status="refunded") should be excluded from revenue calculations
- "Bought together" means distinct students with paid purchases of both courses, regardless of payment date. Count each student once per unordered course pair.
- Do not infer a shared transaction from paymentDate; transaction grouping requires an actual transaction identifier in the schema. If explicitly asked about same-transaction purchases and no such identifier exists, explain this limitation rather than claiming transaction-level results.
- Progress values range from 0-100 (percentage completed)
`;
