from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import UserRegistrationView,LoginView, UserMeView, EntryView, MoodStatsView

urlpatterns = [
    path('auth/register/', UserRegistrationView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserMeView.as_view()),

    path('journal/add/', EntryView.as_view()),
    path('journal/moods/', MoodStatsView.as_view(), name='mood-stats'),

]