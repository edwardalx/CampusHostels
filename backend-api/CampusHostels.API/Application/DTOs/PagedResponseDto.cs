namespace CampusHostels.API.Application.DTOs;

public static class Paging
{
    public const int DefaultPageSize = 25;
    public const int MaxPageSize = 100;
}

public abstract class PagedResponseDto
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;
}
