#!/usr/bin/env ruby
require 'sinatra/base'
require 'sinatra/assetpack'
require 'sinatra/activerecord'
require 'sanitize'
#require 'ruby-debug/debugger'

# What database to use if we're on our hosting, or local
db = ENV['OPENSHIFT_DATA_DIR'] ? File.join(ENV['OPENSHIFT_DATA_DIR'], "rebus.sqlite3") : "db/development.sqlite3"

# Establish connection
ActiveRecord::Base.establish_connection(
  :adapter => "sqlite3",
  :database => db,
  :timeout => 5000
)

# This is the Rebus Contest Web Application class
#
#   The app is a Sinatra application.
#   There is no authentication, users are identified by the current session only
#   TODO: Identify users by a unique URL for each
class App < Sinatra::Base
  set :root, File.dirname(__FILE__)
  use Rack::Session::Pool
  register Sinatra::AssetPack

  # Create new contest in the current session and render the index view template
  get "/" do
    session[:contest] = Contest.new
    erb :index, :locals => { :contests => Contest.all }
  end

  # Create new contest in the current session
  get "/new" do
    session[:contest] = Contest.new
    nil
  end

  # Save a Contest to the database and return the saved attributes
  post "/save" do
    params[:contest]["start"] = DateTime.strptime(params[:contest]["start"], "%m/%d/%Y %H:%M")
    params[:contest]["end"] = DateTime.strptime(params[:contest]["end"], "%m/%d/%Y %H:%M")
    session[:contest].attributes = params[:contest]
    session[:contest].save
    session[:contest].attributes.to_json
  end

  # Return all contests as a JSON object
  get "/contests" do
    content_type :json
    ca = { "contests" => [] }
    Contest.all.each do |c|
      ca["contests"] << c.attributes
    end
    puts ca
    ca.to_json
  end

  # Return the contest with the requested id, including the first point, as JSON
  get "/contests/:id" do
    content_type :json
    c = Contest.find(params[:id])
    { :contest => c, :start => c.points.first }.to_json
  end

  # Render point form for point with given temporary id
  get "/points/:id" do
    p = session[:contest].points.select {|p| p.temp_id == params[:id].to_i }.first rescue nil
    redirect "/404" unless p
    erb :newpoint, :locals => { :point => p }
  end

  # Save point with given temporary id to session, return status only
  post "/points/:id" do
    p = session[:contest].points.select {|p| p.temp_id == params[:id].to_i }.first
    params["point"]["rebus"] = Sanitize.clean(params["point"]["rebus"])
    p.attributes = params["point"]
    nil
  end

  # Add new point at given location to the current contest, and return the point form
  get "/points/new/:location" do
    session[:contest] ||= Contest.new
    loc = JSON.parse(params[:location])
    order = session[:contest].points.size + 1

    p = Point.new :lat => loc["lat"],
                  :lng => loc["lng"],
                  :order => order,
                  :temp_id => order

    session[:contest].points << p
    erb :newpoint, :locals => { :point => p }
  end

  # TODO: Not in use
  get "/gpx" do
    File.read("Rangiwahia-Triangle-Iron.gpx")
  end

  # Serve static assets using Sinatra AssetPack
  assets {
    # The second parameter defines where the compressed version will be served.
    js :app, '/js/app.js', [
      '/js/vendor/**/*.js',
      '/js/app/**/*.js'
    ]

    css :application, '/css/application.less', [
      '/css/screen.css'
    ]
    css :fontello, '/css/fontello.css', [
      '/css/fontello.css'
    ]

    css_compression :less
  }
end

# The Point class represents a geographic point (lat/lng) with a rebus
# It belongs to a Contest among with other Points, in an order.
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

# The Contest class represents a geographical rebus contest
class Contest < ActiveRecord::Base
  has_many :points
  has_many :users

  attr_accessible :name, :location, :start, :end
end

# The User class represents someone partaking in a Contest
class User < ActiveRecord::Base
  belongs_to :contest
end
