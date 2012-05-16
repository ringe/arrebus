#!/usr/bin/env ruby
require 'sinatra/base'
require 'sinatra/assetpack'
require 'sinatra/activerecord'

class App < Sinatra::Base
  set :root, File.dirname(__FILE__)
  register Sinatra::AssetPack

  get "/" do
    erb :index
  end

  get "/newpoint/:location" do
    p = Point.create(:lat => params[:location]["lat"], :lng => params[:location]["lng"], :order => 1)
    logger.info p.errors.to_json
    erb :newpoint, :locals  => { :point => p }
  end

  get "/gpx" do
    File.read("Rangiwahia-Triangle-Iron.gpx")
  end

  assets {
    serve '/js',     :from => 'app/js'     # Optional
    serve '/css',    :from => 'app/less'   # Optional
    serve '/images', :from => 'app/img'    # Optional

    # The second parameter defines where the compressed version will be served.
    # (Note: that parameter is optional, AssetPack will figure it out.)
    js :app, '/js/app.js', [
      '/js/vendor/**/*.js',
      '/js/app/**/*.js'
    ]

    css :application, '/css/application.less', [
      '/css/screen.css',
      '/css/fontello.css'
    ]

    css_compression :less       # Optional
  }

end
ActiveRecord::Base.establish_connection(
  :adapter => "sqlite3",
  :database => "db/development.sqlite3",
  :timeout => 5000
)

class Point < ActiveRecord::Base
  validates_presence_of :lat
  validates_presence_of :lng
  validates_presence_of :order
end
