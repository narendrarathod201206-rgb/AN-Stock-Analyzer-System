from django.urls import path, reverse_lazy
from django.contrib.auth import views as auth_views
from . import views

app_name = 'stock'

urlpatterns = [
    # ── Auth pages ───────────────────────────────────────────────────
    path('login/',    views.login_view,    name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/',   views.logout_view,   name='logout'),

    # Password Reset
    path('password_reset/', auth_views.PasswordResetView.as_view(
        template_name='stock/password_reset.html',
        email_template_name='stock/password_reset_email.html',
        success_url=reverse_lazy('stock:password_reset_done')
    ), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='stock/password_reset_done.html'
    ), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='stock/password_reset_confirm.html',
        success_url=reverse_lazy('stock:password_reset_complete')
    ), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(
        template_name='stock/password_reset_complete.html'
    ), name='password_reset_complete'),

    # ── Page views (login-required) ──────────────────────────────────
    path('',              views.dashboard,     name='dashboard'),
    path('watchlist/',    views.watchlist,     name='watchlist'),
    path('portfolio/',    views.portfolio,     name='portfolio'),
    path('analytics/',    views.analytics,     name='analytics'),
    path('news/',         views.news_page,     name='news'),
    path('screener/',     views.screener,      name='screener'),
    path('signals/',      views.signals_page,  name='signals'),
    path('stock/<str:symbol>/', views.stock_detail, name='stock_detail'),
    path('settings/',     views.settings_view, name='settings'),
    path('export/portfolio/', views.export_portfolio_csv, name='export_portfolio'),
    
    # Subscriptions
    path('pricing/',      views.pricing_view,  name='pricing'),
    path('checkout/<str:plan>/', views.checkout_view, name='checkout'),

    # ── REST APIs ────────────────────────────────────────────────────
    path('api/market/',                views.MarketAPIView.as_view(),   name='api_market'),
    path('api/quote/<str:symbol>/',    views.QuoteAPIView.as_view(),    name='api_quote'),
    path('api/history/<str:symbol>/',  views.HistoryAPIView.as_view(),  name='api_history'),
    path('api/analysis/<str:symbol>/', views.AnalysisAPIView.as_view(), name='api_analysis'),
    path('api/movers/',                views.MoversAPIView.as_view(),   name='api_movers'),
    path('api/sectors/',               views.SectorsAPIView.as_view(),  name='api_sectors'),
    path('api/news/',                  views.NewsAPIView.as_view(),     name='api_news'),
    path('api/screener/',              views.ScreenerAPIView.as_view(), name='api_screener'),
    path('api/subscribe/',             views.ProcessSubscriptionView.as_view(), name='api_subscribe'),

    # Watchlist CRUD
    path('api/watchlist/',         views.WatchlistAPIView.as_view(),    name='api_watchlist'),
    path('api/watchlist/<int:pk>/',views.WatchlistDeleteAPIView.as_view(), name='api_watchlist_delete'),

    # Portfolio CRUD
    path('api/portfolio/',                 views.PortfolioAPIView.as_view(),    name='api_portfolio'),
    path('api/portfolio/<int:pk>/',        views.PortfolioDeleteAPIView.as_view(), name='api_portfolio_delete'),
    path('api/portfolio/recommendations/', views.PortfolioRecommendationAPIView.as_view(), name='api_portfolio_recs'),

    # Alerts CRUD
    path('api/alerts/',            views.AlertAPIView.as_view(),        name='api_alerts'),
    path('api/alerts/<int:pk>/',   views.AlertDeleteAPIView.as_view(),  name='api_alerts_delete'),
]
