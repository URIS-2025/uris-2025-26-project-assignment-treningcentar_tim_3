using MeasurmentService.Data;
using Microsoft.EntityFrameworkCore;

namespace MeasurmentService.Tests;

/// <summary>
/// Test variant of MeasurementContext that uses InMemory database instead of Npgsql.
/// Pass options built with UseInMemoryDatabase into the constructor.
/// </summary>
public class TestMeasurementContext : MeasurementContext
{
    public TestMeasurementContext(DbContextOptions<MeasurementContext> options)
        : base(options) { }
}
