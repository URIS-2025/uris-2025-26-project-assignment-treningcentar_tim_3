using System.Net;

namespace MeasurmentService.Clients;

public class ServiceServiceClient
{
    private readonly HttpClient _http;

    public ServiceServiceClient(IHttpClientFactory factory)
    {
        _http = factory.CreateClient("ServiceService");
    }

    public async Task<bool> ServiceExistsAsync(Guid serviceId)
    {
        // ServiceService ruta je /api/service/{id}
        var res = await _http.GetAsync($"/api/service/{serviceId}");

        if (res.StatusCode == HttpStatusCode.NotFound) return false;

        // sve ostalo mora biti 2xx, u suprotnom bacamo exception
        res.EnsureSuccessStatusCode();
        return true;
    }
}