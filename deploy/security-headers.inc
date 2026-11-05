add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://fjbvtaytgamlwybmwoks.supabase.co wss://fjbvtaytgamlwybmwoks.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
