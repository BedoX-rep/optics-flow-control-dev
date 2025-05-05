
// Fix the TypeScript error related to sortBy parameter type
// Change the following line:
// const handleSort = (sortBy: keyof Product) => {
// To:
const handleSort = (sortBy: string) => {
  setSortBy(sortBy as keyof Product);
  sortProducts(products, sortBy as keyof Product, sortDirection);
};
