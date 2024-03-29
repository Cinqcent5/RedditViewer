from django.db import models

class User(models.Model):
    uid = models.CharField(max_length=36, primary_key=True)
    created_date = models.DateTimeField()
    last_visited_date = models.DateTimeField()
    allow_nsfw = models.BooleanField(default=False)
    show_details = models.BooleanField(default=False)
    show_all_links = models.BooleanField(default=False)
    user_agent = models.CharField(max_length=150)
    
    def __unicode__(self):
        return self.uid
