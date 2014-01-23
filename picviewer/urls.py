from django.conf.urls import patterns, url
from django.contrib import admin
from picviewer import views

admin.autodiscover()

urlpatterns = patterns('',
                       
    url(r'^r/(?P<subreddit>[A-z0-9+]+)$', views.loadSubreddit,name='subreddit' ),
    url(r'^$', views.default, name='default'),
)
