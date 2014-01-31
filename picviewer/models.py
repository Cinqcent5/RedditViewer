from django.db import models

class User(models.Model):
    uid=models.CharField(max_length=36,primary_key=True)
    allow_nsfw=models.BooleanField(default=False)
    show_details=models.BooleanField(default=False)
    show_all_links=models.BooleanField(default=False)
    
    def __unicode__(self):
        return self.uid