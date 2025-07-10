from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import UserRegistrationView,LoginView, UserMeView, EntryView, MoodStatsView

urlpatterns = [
    path('auth/register/', UserRegistrationView.as_view()),

    path('api/token/', LoginView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('users/me/', UserMeView.as_view()),
    path('user/entry/', EntryView.as_view()),

    path('api/journal/mood-stats/', MoodStatsView.as_view(), name='mood-stats'),

]