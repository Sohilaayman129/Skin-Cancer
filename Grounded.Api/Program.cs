using Grounded.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers with camelCase JSON formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Add OpenAPI / Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Add HttpClient factory for Python proxy
builder.Services.AddHttpClient();

// Register Grounded Clinical Services
builder.Services.AddSingleton<ISafetyGuardService, SafetyGuardService>();
builder.Services.AddSingleton<IChatSessionService, ChatSessionService>();
builder.Services.AddScoped<IGroundedRagService, GroundedRagService>();

// CORS configuration for Angular & other frontends
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",   // Angular default
                "http://localhost:8080",
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:4200",
                "http://127.0.0.1:8080",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true); // Permissive for local testing
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Fallback route / Root info
app.MapGet("/", () => Results.Ok(new
{
    service = "Grounded Clinical AI Assistant — .NET 9 API",
    status = "Active",
    guideline = "USPSTF 2018 Skin Cancer Prevention Counseling",
    endpoints = new[]
    {
        "POST /api/ask - Ask evidence-bound clinical questions",
        "GET /api/ask/sample-questions - Sample clinical questions",
        "GET /api/health - Check service health and RAG index status",
        "GET /api/sessions - Retrieve chat sessions",
        "GET /openapi/v1.json - OpenAPI schema"
    }
}));

app.Run();
