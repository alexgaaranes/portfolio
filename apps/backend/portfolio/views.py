from rest_framework import viewsets, permissions, response, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
import pyotp
import base64
from .models import Project, Blog, Profile, ProjectImage, BlogImage
from .serializers import (
    ProjectSerializer, ProjectListSerializer,
    BlogSerializer, BlogListSerializer,
    ProfileSerializer
)

class ReadOnlyOrAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    permission_classes = [ReadOnlyOrAdminPermission]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_image(self, request, pk=None):
        project = self.get_object()
        if project.images.count() >= 5:
            return response.Response({"detail": "Maximum 5 images allowed."}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES.get('image')
        if not image_file:
            return response.Response({"detail": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to Base64
        base64_string = base64.b64encode(image_file.read()).decode('utf-8')
        mime_type = image_file.content_type
        formatted_base64 = f"data:{mime_type};base64,{base64_string}"
        
        ProjectImage.objects.create(project=project, image_base64=formatted_base64, order=project.images.count())
        return response.Response(ProjectSerializer(project).data)

    @action(detail=True, methods=['delete'], url_path='delete_image/(?P<image_id>\d+)', permission_classes=[permissions.IsAuthenticated])
    def delete_image(self, request, pk=None, image_id=None):
        project = self.get_object()
        try:
            image = project.images.get(id=image_id)
            image.delete()
            return response.Response(ProjectSerializer(project).data)
        except ProjectImage.DoesNotExist:
            return response.Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)

class BlogViewSet(viewsets.ModelViewSet):
    queryset = Blog.objects.all().order_by('-created_at')
    permission_classes = [ReadOnlyOrAdminPermission]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return BlogListSerializer
        return BlogSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_image(self, request, pk=None):
        blog = self.get_object()
        if blog.images.count() >= 5:
            return response.Response({"detail": "Maximum 5 images allowed."}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES.get('image')
        if not image_file:
            return response.Response({"detail": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        base64_string = base64.b64encode(image_file.read()).decode('utf-8')
        mime_type = image_file.content_type
        formatted_base64 = f"data:{mime_type};base64,{base64_string}"
        
        BlogImage.objects.create(blog=blog, image_base64=formatted_base64, order=blog.images.count())
        return response.Response(BlogSerializer(blog).data)

    @action(detail=True, methods=['delete'], url_path='delete_image/(?P<image_id>\d+)', permission_classes=[permissions.IsAuthenticated])
    def delete_image(self, request, pk=None, image_id=None):
        blog = self.get_object()
        try:
            image = blog.images.get(id=image_id)
            image.delete()
            return response.Response(BlogSerializer(blog).data)
        except BlogImage.DoesNotExist:
            return response.Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)

class ProfileViewSet(viewsets.ViewSet):
    permission_classes = [ReadOnlyOrAdminPermission]

    def list(self, request):
        profile = Profile.objects.first()
        serializer = ProfileSerializer(profile)
        return response.Response(serializer.data)

    def partial_update(self, request, pk=None):
        profile = Profile.objects.first()
        if not profile:
            return response.Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return response.Response(serializer.data)
        
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MFATokenObtainView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        totp_code = request.data.get('totp_code')
        totp_secret_setup = request.data.get('totp_secret_setup')

        user = authenticate(username=username, password=password)
        if not user or not user.is_active:
            return response.Response({"detail": "No active account found with the given credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        profile = Profile.objects.first()
        if not profile:
            profile = Profile.objects.create(name=user.username, email=user.email or "admin@example.com", contact_no="0000000000")

        if not profile.totp_secret:
            if totp_code and totp_secret_setup:
                totp = pyotp.TOTP(totp_secret_setup)
                if totp.verify(totp_code):
                    profile.totp_secret = totp_secret_setup
                    profile.save()
                    return super().post(request, *args, **kwargs)
                else:
                    return response.Response({"detail": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                secret = pyotp.random_base32()
                totp = pyotp.TOTP(secret)
                provisioning_url = totp.provisioning_uri(name=user.email or user.username, issuer_name="Portfolio CMS")
                return response.Response({
                    "status": "totp_setup",
                    "totp_secret": secret,
                    "provisioning_url": provisioning_url
                }, status=status.HTTP_200_OK)
        else:
            if not totp_code:
                return response.Response({
                    "status": "totp_required"
                }, status=status.HTTP_200_OK)
            
            totp = pyotp.TOTP(profile.totp_secret)
            if totp.verify(totp_code):
                return super().post(request, *args, **kwargs)
            else:
                return response.Response({"detail": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)
