from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    PLAN_CHOICES = [('free','Free'),('pro','Pro Trader'),('elite','Elite')]
    user               = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar             = models.CharField(max_length=2, default='👤')
    plan               = models.CharField(max_length=10, choices=PLAN_CHOICES, default='free')
    subscription_end   = models.DateTimeField(null=True, blank=True)
    dark_mode          = models.BooleanField(default=True)
    created_at         = models.DateTimeField(default=timezone.now)

    def is_premium(self):
        if self.plan == 'free': return False
        if not self.subscription_end: return False
        return self.subscription_end > timezone.now()

    def has_indicators_access(self):
        """Allows access to Indicators (Pro & Elite)."""
        return self.is_premium() and self.plan in ['pro', 'elite']

    def has_signals_access(self):
        """Allows access to Signals (Elite Only)."""
        return self.is_premium() and self.plan == 'elite'

    def __str__(self):
        return f"{self.user.username} – {self.plan}"

# ── SIGNALS ──
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


class SubscriptionOrder(models.Model):
    STATUS_CHOICES = [('pending','Pending Approval'),('approved','Approved'),('rejected','Rejected')]
    PLAN_CHOICES   = [('pro','Pro Trader'),('elite','Elite Edition')]
    DURATION_CHOICES = [(1,'1 Month'),(6,'6 Months'),(12,'12 Months')]

    user            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    plan            = models.CharField(max_length=10, choices=PLAN_CHOICES)
    duration_months = models.IntegerField(choices=DURATION_CHOICES, default=1)
    amount          = models.FloatField()
    transaction_id  = models.CharField(max_length=100) # User enters UPI Ref No
    status          = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at      = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} - {self.plan} ({self.status})"


class WatchlistItem(models.Model):
    user   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist', null=True, blank=True)
    symbol = models.CharField(max_length=30)
    name   = models.CharField(max_length=100, blank=True)
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-added_at']

    def __str__(self):
        return self.symbol


class PortfolioHolding(models.Model):
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio', null=True, blank=True)
    symbol        = models.CharField(max_length=30)
    name          = models.CharField(max_length=100, blank=True)
    quantity      = models.FloatField(default=0)
    avg_buy_price = models.FloatField(default=0)
    added_at      = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.symbol} x{self.quantity}"

    @property
    def invested_value(self):
        return self.quantity * self.avg_buy_price


class StockAlert(models.Model):
    CONDITION_CHOICES = [('above','Price Above'),('below','Price Below')]
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts', null=True, blank=True)
    symbol       = models.CharField(max_length=30)
    condition    = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    target_price = models.FloatField()
    is_active    = models.BooleanField(default=True)
    triggered    = models.BooleanField(default=False)
    created_at   = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.symbol} {self.condition} {self.target_price}"


class NewsCache(models.Model):
    headline   = models.TextField()
    source     = models.CharField(max_length=100, blank=True)
    url        = models.URLField(max_length=500, blank=True)
    summary    = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    fetched_at   = models.DateTimeField(default=timezone.now)
    symbol       = models.CharField(max_length=30, default='^NSEI')

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.headline[:60]
