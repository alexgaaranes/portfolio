from django.db import models

class Profile(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    contact_no = models.CharField(max_length=20)
    linkedin_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    cv_file = models.FileField(upload_to='cvs/', blank=True, null=True)
    summary = models.TextField(blank=True, null=True) # stores Markdown

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Profile"

class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField() # stores HTML
    link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ProjectImage(models.Model):
    project = models.ForeignKey(Project, related_name='images', on_delete=models.CASCADE)
    image_base64 = models.TextField() # Storing as Base64 string
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

class Blog(models.Model):
    headline = models.CharField(max_length=200)
    body = models.TextField() # stores HTML
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.headline

class BlogImage(models.Model):
    blog = models.ForeignKey(Blog, related_name='images', on_delete=models.CASCADE)
    image_base64 = models.TextField() # Storing as Base64 string
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
