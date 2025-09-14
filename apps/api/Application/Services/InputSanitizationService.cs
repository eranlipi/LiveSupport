using Ganss.Xss;

namespace Application.Services;

public interface IInputSanitizationService
{
    string SanitizeHtml(string input);
    string SanitizeText(string input);
}

public class InputSanitizationService : IInputSanitizationService
{
    private readonly HtmlSanitizer _sanitizer;

    public InputSanitizationService()
    {
        _sanitizer = new HtmlSanitizer();

        // Configure allowed tags and attributes for rich text content
        _sanitizer.AllowedTags.Clear();
        _sanitizer.AllowedTags.Add("p");
        _sanitizer.AllowedTags.Add("br");
        _sanitizer.AllowedTags.Add("strong");
        _sanitizer.AllowedTags.Add("em");
        _sanitizer.AllowedTags.Add("ul");
        _sanitizer.AllowedTags.Add("ol");
        _sanitizer.AllowedTags.Add("li");

        // Remove dangerous attributes
        _sanitizer.AllowedAttributes.Clear();

        // Remove dangerous schemes
        _sanitizer.AllowedSchemes.Clear();
        _sanitizer.AllowedSchemes.Add("http");
        _sanitizer.AllowedSchemes.Add("https");
        _sanitizer.AllowedSchemes.Add("mailto");
    }

    public string SanitizeHtml(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        return _sanitizer.Sanitize(input);
    }

    public string SanitizeText(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        // For plain text, remove all HTML tags
        var tempSanitizer = new HtmlSanitizer();
        tempSanitizer.AllowedTags.Clear();

        return tempSanitizer.Sanitize(input);
    }
}