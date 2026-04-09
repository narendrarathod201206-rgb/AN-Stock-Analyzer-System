import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from stock.views import _get_quote, NSE_STOCKS

for sym in list(NSE_STOCKS.keys())[:5]:
    q = _get_quote(sym)
    print(f"Symbol: {sym}, Name: {q.get('name') if q else 'None'}")
