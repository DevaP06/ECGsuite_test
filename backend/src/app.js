const mlRoutes =
  require(
    "./routes/mlRoutes"
  );
app.use(
  "/api/ml",
  mlRoutes
);