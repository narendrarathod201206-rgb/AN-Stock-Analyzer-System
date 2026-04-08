from django.contrib import admin
from django.utils import timezone
from datetime import timedelta
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import WatchlistItem, PortfolioHolding, StockAlert, NewsCache, UserProfile, SubscriptionOrder

@admin.register(UserProfile)
class UserProfileAdmin(ModelAdmin):
    list_display = ['user', 'colored_plan', 'is_premium_status', 'dark_mode', 'created_at']
    search_fields = ['user__username', 'user__email']
    list_filter = ['plan', 'dark_mode']
    readonly_fields = ['created_at']
    actions = ['grant_7_days_elite', 'grant_30_days_elite', 'grant_30_days_pro', 'reset_to_free']

    fieldsets = (
        ("User Information", {
            "fields": ("user", "dark_mode"),
        }),
        ("Subscription Details", {
            "fields": ("plan", "subscription_end"),
        }),
    )

    @display(description="Plan", label={
        "free": "bg-slate-100 text-slate-800",
        "pro": "bg-indigo-100 text-indigo-800",
        "elite": "bg-purple-100 text-purple-800",
    })
    def colored_plan(self, obj):
        return obj.plan

    @display(description="Premium Status", boolean=True)
    def is_premium_status(self, obj):
        return obj.is_premium()

    def grant_7_days_elite(self, request, queryset):
        for profile in queryset:
            profile.plan = 'elite'
            profile.subscription_end = timezone.now() + timedelta(days=7)
            profile.save()
        self.message_user(request, f"7 Days Elite access granted to {queryset.count()} users.")
    grant_7_days_elite.short_description = "Gift: 7 Days Elite Trial"

    def grant_30_days_elite(self, request, queryset):
        for profile in queryset:
            profile.plan = 'elite'
            profile.subscription_end = timezone.now() + timedelta(days=30)
            profile.save()
        self.message_user(request, f"30 Days Elite access granted to {queryset.count()} users.")
    grant_30_days_elite.short_description = "Gift: 30 Days Elite (Free)"

    def grant_30_days_pro(self, request, queryset):
        for profile in queryset:
            profile.plan = 'pro'
            profile.subscription_end = timezone.now() + timedelta(days=30)
            profile.save()
        self.message_user(request, f"30 Days Pro access granted to {queryset.count()} users.")
    grant_30_days_pro.short_description = "Gift: 30 Days Pro (Free)"

    def reset_to_free(self, request, queryset):
        queryset.update(plan='free', subscription_end=None)
        self.message_user(request, "Selected users reset to Free plan.")
    reset_to_free.short_description = "Reset to Free Plan"

@admin.register(SubscriptionOrder)
class SubscriptionOrderAdmin(ModelAdmin):
    list_display = ['user', 'plan', 'amount', 'transaction_id', 'colored_status', 'created_at']
    list_filter  = ['status', 'plan', 'created_at']
    search_fields = ['user__username', 'transaction_id']
    readonly_fields = ['created_at']
    actions      = ['approve_orders']

    fieldsets = (
        ("Customer Details", {
            "fields": ("user",),
        }),
        ("Order Context", {
            "fields": ("plan", "duration_months", "amount"),
        }),
        ("Payment Verification", {
            "fields": ("transaction_id", "status"),
        }),
    )

    @display(description="Order Status", label={
        "pending": "bg-amber-100 text-amber-800",
        "approved": "bg-emerald-100 text-emerald-800",
        "rejected": "bg-rose-100 text-rose-800",
    })
    def colored_status(self, obj):
        return obj.status

    def approve_orders(self, request, queryset):
        for order in queryset.filter(status='pending'):
            # Safely get or create profile
            profile, created = UserProfile.objects.get_or_create(user=order.user)
            profile.plan = order.plan
            
            # Update expiry
            now = timezone.now()
            if order.duration_months == 1:
                profile.subscription_end = now + timedelta(days=30)
            elif order.duration_months == 6:
                profile.subscription_end = now + timedelta(days=180)
            elif order.duration_months == 12:
                profile.subscription_end = now + timedelta(days=365)
            
            profile.save()
            order.status = 'approved'
            order.save()
        self.message_user(request, f"{queryset.count()} order(s) processed. Plans activated successfully.")
    approve_orders.short_description = "Approve & Activate Selected Orders"

@admin.register(WatchlistItem)
class WatchlistAdmin(ModelAdmin):
    list_display = ['user', 'symbol', 'name', 'added_at']
    list_filter  = ['user', 'added_at']
    search_fields = ['symbol', 'name', 'user__username']

@admin.register(PortfolioHolding)
class PortfolioAdmin(ModelAdmin):
    list_display = ['user', 'symbol', 'quantity', 'avg_buy_price', 'current_value', 'added_at']
    list_filter = ['user', 'added_at']
    search_fields = ['symbol', 'user__username']

    def current_value(self, obj):
        return f"₹{obj.quantity * obj.avg_buy_price:,.2f}"
    current_value.short_description = "Invested Amount"

@admin.register(StockAlert)
class AlertAdmin(ModelAdmin):
    list_display = ['user', 'symbol', 'condition', 'target_price', 'alert_triggered', 'active_status']
    list_filter = ['triggered', 'is_active', 'condition']
    search_fields = ['symbol', 'user__username']

    @display(description="Triggered", label=True)
    def alert_triggered(self, obj):
        return "TRIGGERED" if obj.triggered else "WAITING"

    @display(description="Status", label={"True": "bg-emerald-100 text-emerald-800", "False": "bg-slate-100 text-slate-800"})
    def active_status(self, obj):
        return str(obj.is_active)

@admin.register(NewsCache)
class NewsCacheAdmin(ModelAdmin):
    list_display = ['headline', 'source', 'symbol', 'fetched_at']
    list_filter = ['source', 'fetched_at']
    search_fields = ['headline', 'symbol', 'source']
