# PowerShell Static HTTP Web Server
# Serves static files in the current directory on http://localhost:8000

$port = 8002
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

# Set up Ctrl+C handler
$host.UI.RawUI.FlushInputBuffer()

try {
    $listener.Start()
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  PowerShell Static Web Server Active!" -ForegroundColor Green
    Write-Host "  URL: http://localhost:$port/" -ForegroundColor Cyan
    Write-Host "  Serving from: $(Get-Location)" -ForegroundColor Gray
    Write-Host "  Press Ctrl+C in your terminal to stop." -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Cyan
    
    $root = Get-Item .
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") {
            $urlPath = "/index.html"
        }
        
        # Parse path correctly
        $subPath = $urlPath.Replace("/", "\").TrimStart("\")
        $filePath = Join-Path $root.FullName $subPath
        
        # Prevent Directory Traversal
        if (-not $filePath.StartsWith($root.FullName)) {
            $response.StatusCode = 403
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            $response.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mimeType = switch ($extension) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".png"  { "image/png" }
                ".gif"  { "image/gif" }
                ".svg"  { "image/svg+xml" }
                ".ico"  { "image/x-icon" }
                ".json" { "application/json" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $mimeType
            
            # Prevent browser caching of development files
            $response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            $response.Headers.Add("Pragma", "no-cache")
            
            # Read and send file bytes
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        
        $response.Close()
    }
} catch {
    Write-Host "Server error: $_" -ForegroundColor Red
} finally {
    if ($listener -ne $null) {
        $listener.Stop()
        $listener.Close()
    }
    Write-Host "Server stopped." -ForegroundColor Yellow
}
