from django.conf.urls import patterns, url
from django.contrib import admin
from picviewer import views

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^r/(?P<subreddit>[A-z0-9+]+)/(?P<order>hot|new|rising|controversial|top|)$', views.full, name='full'),
    url(r'^(?P<order>hot|new|rising|controversial|top|)$', views.sort, name='sort'),
    url(r'^r/(?P<subreddit>[A-z0-9+]+)$', views.subreddit, name='subreddit'),
    url(r'^$', views.default, name='default'),
)
