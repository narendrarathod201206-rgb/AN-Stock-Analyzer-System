from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='NewsCache',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('headline', models.TextField()),
                ('source', models.CharField(blank=True, max_length=100)),
                ('url', models.URLField(blank=True, max_length=500)),
                ('summary', models.TextField(blank=True)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('fetched_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('symbol', models.CharField(default='^NSEI', max_length=30)),
            ],
            options={
                'ordering': ['-published_at'],
            },
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('avatar', models.CharField(default='👤', max_length=2)),
                ('plan', models.CharField(choices=[('free', 'Free'), ('pro', 'Pro Trader'), ('elite', 'Elite')], default='pro', max_length=10)),
                ('dark_mode', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to='auth.user')),
            ],
        ),
        migrations.CreateModel(
            name='WatchlistItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('symbol', models.CharField(max_length=30)),
                ('name', models.CharField(blank=True, max_length=100)),
                ('added_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='watchlist', to='auth.user')),
            ],
            options={
                'ordering': ['-added_at'],
            },
        ),
        migrations.CreateModel(
            name='PortfolioHolding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('symbol', models.CharField(max_length=30)),
                ('name', models.CharField(blank=True, max_length=100)),
                ('quantity', models.FloatField(default=0)),
                ('avg_buy_price', models.FloatField(default=0)),
                ('added_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='portfolio', to='auth.user')),
            ],
            options={
                'ordering': ['-added_at'],
            },
        ),
        migrations.CreateModel(
            name='StockAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('symbol', models.CharField(max_length=30)),
                ('condition', models.CharField(choices=[('above', 'Price Above'), ('below', 'Price Below')], max_length=10)),
                ('target_price', models.FloatField()),
                ('is_active', models.BooleanField(default=True)),
                ('triggered', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='alerts', to='auth.user')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
