from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, BlogViewSet, ProfileViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'blogs', BlogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', ProfileViewSet.as_view({'get': 'list', 'patch': 'partial_update'}), name='profile-singleton'),
]
