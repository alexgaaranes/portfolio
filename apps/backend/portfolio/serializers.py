from rest_framework import serializers
from .models import Project, Blog, Profile, ProjectImage, BlogImage
import re

class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'image_base64', 'order']

class ProjectSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'link', 'created_at', 'images']

class ProjectListSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'link', 'created_at', 'images']

    def get_images(self, obj):
        first_image = obj.images.first()
        if first_image:
            return [{'id': first_image.id, 'image_base64': first_image.image_base64, 'order': first_image.order}]
        return []

    def get_description(self, obj):
        if not obj.description:
            return ""
        # Strip base64 inline images and local blob urls from list description
        cleaned = re.sub(r'!\[.*?\]\(data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=]+\)', '', obj.description)
        cleaned = re.sub(r'!\[.*?\]\(blob:[^\s)]+\)', '', cleaned)
        return cleaned[:300]

class BlogImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogImage
        fields = ['id', 'image_base64', 'order']

class BlogSerializer(serializers.ModelSerializer):
    images = BlogImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Blog
        fields = ['id', 'headline', 'body', 'created_at', 'images']

class BlogListSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()

    class Meta:
        model = Blog
        fields = ['id', 'headline', 'body', 'created_at', 'images']

    def get_images(self, obj):
        first_image = obj.images.first()
        if first_image:
            return [{'id': first_image.id, 'image_base64': first_image.image_base64, 'order': first_image.order}]
        return []

    def get_body(self, obj):
        if not obj.body:
            return ""
        cleaned = re.sub(r'!\[.*?\]\(data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=]+\)', '', obj.body)
        cleaned = re.sub(r'!\[.*?\]\(blob:[^\s)]+\)', '', cleaned)
        return cleaned[:300]

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        exclude = ['totp_secret']
