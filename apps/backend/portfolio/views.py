from rest_framework import viewsets, permissions, response, status
from rest_framework.decorators import action
from .models import Project, Blog, Profile, ProjectImage, BlogImage
from .serializers import ProjectSerializer, BlogSerializer, ProfileSerializer
import base64

class ReadOnlyOrAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

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
        return response.Response(self.get_serializer(project).data)

    @action(detail=True, methods=['delete'], url_path='delete_image/(?P<image_id>\d+)', permission_classes=[permissions.IsAuthenticated])
    def delete_image(self, request, pk=None, image_id=None):
        project = self.get_object()
        try:
            image = project.images.get(id=image_id)
            image.delete()
            return response.Response(self.get_serializer(project).data)
        except ProjectImage.DoesNotExist:
            return response.Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)

class BlogViewSet(viewsets.ModelViewSet):
    queryset = Blog.objects.all().order_by('-created_at')
    serializer_class = BlogSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

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
        return response.Response(self.get_serializer(blog).data)

    @action(detail=True, methods=['delete'], url_path='delete_image/(?P<image_id>\d+)', permission_classes=[permissions.IsAuthenticated])
    def delete_image(self, request, pk=None, image_id=None):
        blog = self.get_object()
        try:
            image = blog.images.get(id=image_id)
            image.delete()
            return response.Response(self.get_serializer(blog).data)
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
