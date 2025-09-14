using Ganss.Xss;
using System.Text.RegularExpressions;

namespace Application.Services;

public interface IInputSanitizationService
{
    string SanitizeHtml(string input);
    string SanitizeText(string input);
    string SanitizeFileName(string input);
    bool IsContentSafe(string input);
}

public class InputSanitizationService : IInputSanitizationService
{
    private readonly HtmlSanitizer _htmlSanitizer;
    private readonly HtmlSanitizer _textSanitizer;

    private static readonly Regex DangerousPatternRegex = new(
        @"(javascript:|data:|vbscript:|on\w+\s*=|<script|<iframe|<object|<embed)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex FileNameRegex = new(
        @"^[a-zA-Z0-9._\-\s]+$",
        RegexOptions.Compiled);

    public InputSanitizationService()
    {
        _htmlSanitizer = CreateHtmlSanitizer();
        _textSanitizer = CreateTextSanitizer();
    }

    private static HtmlSanitizer CreateHtmlSanitizer()
    {
        var sanitizer = new HtmlSanitizer();

        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedTags.Add("p");
        sanitizer.AllowedTags.Add("br");
        sanitizer.AllowedTags.Add("strong");
        sanitizer.AllowedTags.Add("em");
        sanitizer.AllowedTags.Add("ul");
        sanitizer.AllowedTags.Add("ol");
        sanitizer.AllowedTags.Add("li");
        sanitizer.AllowedTags.Add("h1");
        sanitizer.AllowedTags.Add("h2");
        sanitizer.AllowedTags.Add("h3");

        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedAttributes.Add("class");

        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.Add("http");
        sanitizer.AllowedSchemes.Add("https");
        sanitizer.AllowedSchemes.Add("mailto");

        sanitizer.RemovingAttribute += (sender, args) =>
        {
            if (args.Attribute.Name.StartsWith("on", StringComparison.OrdinalIgnoreCase))
            {
                args.Cancel = false;
            }
        };

        return sanitizer;
    }

    private static HtmlSanitizer CreateTextSanitizer()
    {
        var sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedSchemes.Clear();
        return sanitizer;
    }

    public string SanitizeHtml(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input ?? string.Empty;

        return _htmlSanitizer.Sanitize(input.Trim());
    }

    public string SanitizeText(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input ?? string.Empty;

        var sanitized = _textSanitizer.Sanitize(input.Trim());

        return sanitized.Replace("&lt;", "<")
                       .Replace("&gt;", ">")
                       .Replace("&amp;", "&")
                       .Replace("&quot;", "\"")
                       .Replace("&#x27;", "'");
    }

    public string SanitizeFileName(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        var fileName = input.Trim();

        if (!FileNameRegex.IsMatch(fileName))
        {
            fileName = Regex.Replace(fileName, @"[^a-zA-Z0-9._\-\s]", "");
        }

        fileName = fileName.Replace("..", "").Replace("//", "");

        return fileName.Length > 255 ? fileName[..255] : fileName;
    }

    public bool IsContentSafe(string input)
    {
        if (string.IsNullOrEmpty(input))
            return true;

        return !DangerousPatternRegex.IsMatch(input);
    }
}