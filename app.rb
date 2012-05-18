#!/usr/bin/env ruby
require 'sinatra/base'
require 'sinatra/assetpack'
require 'sinatra/activerecord'
require 'sanitize'
#require 'ruby-debug/debugger'

db = ENV['OPENSHIFT_DATA_DIR'] ? File.join(ENV['OPENSHIFT_DATA_DIR'], "rebus.sqlite3") : "db/development.sqlite3"

ActiveRecord::Base.establish_connection(
  :adapter => "sqlite3",
  :database => db,
  :timeout => 5000
)

class App < Sinatra::Base
  set :root, File.dirname(__FILE__)
  use Rack::Session::Pool
  register Sinatra::AssetPack

  # Create new contest in session and render index page
  get "/" do
    session[:contest] = Contest.new
    erb :index, :locals => { :contests => Contest.all }
  end

  # Create new contest in session
  get "/new" do
    session[:contest] = Contest.new
    nil
  end

  post "/save" do
    params[:contest]["start"] = DateTime.strptime(params[:contest]["start"], "%m/%d/%Y %H:%M")
    params[:contest]["end"] = DateTime.strptime(params[:contest]["end"], "%m/%d/%Y %H:%M")
    session[:contest].attributes = params[:contest]
    session[:contest].save
    session[:contest].attributes.to_json
  end

  get "/contests" do
    Contest.all.to_json
  end

  get "/contests/:id" do
    c = Contest.find(params[:id])
    { :contest => c, :start => c.points.first }.to_json
  end

  # Save point with given temporary id to session
  post "/points/:id" do
    p = session[:contest].points.select {|p| p.temp_id == params[:id].to_i }.first
    params["point"]["rebus"] = Sanitize.clean(params["point"]["rebus"])
    p.attributes = params["point"]
#    puts p.attributes
    nil
  end

  # Render point form for point with given temporary id
  get "/points/:id" do
    p = session[:contest].points.select {|p| p.temp_id == params[:id].to_i }.first rescue nil
    redirect "/404" unless p
    erb :newpoint, :locals => { :point => p }
  end

  # Add new point at given location to the current contest, return point form
  get "/points/new/:location" do
    session[:contest] ||= Contest.new
    loc = JSON.parse(params[:location])
    order = session[:contest].points.size + 1

    p = Point.new :lat => loc["lat"],
                  :lng => loc["lng"],
                  :order => order,
                  :temp_id => order

#    puts p.attributes
    session[:contest].points << p
#    puts session[:contest].points.first.attributes
    erb :newpoint,
        :locals => { :point => p }
  end

  post "points/:location" do
    logger.info params
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

class Point < ActiveRecord::Base
  belongs_to :contest

  attr_accessor :temp_id

  def id
    self[:id].nil? ? @temp_id : self[:id]
  end

  attr_accessible :lat, :lng, :order, :temp_id, :rebus, :range

  validates_presence_of :lat
  validates_presence_of :lng
  validates_presence_of :order
end

class Contest < ActiveRecord::Base
  has_many :points
  has_many :users

  attr_accessible :name, :location, :start, :end
end

class User < ActiveRecord::Base
  belongs_to :contest
end
