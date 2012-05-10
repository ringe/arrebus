#!/usr/bin/env ruby

require 'sinatra'
require 'sinatra/activerecord'

ActiveRecord::Base.establish_connection(
  adapter: "sqlite3",
  database: "db/development.sqlite3",
  timeout: 5000
)

get "/" do
  erb :index, :locals  => { :image => "image.png" }
end

get "/gpx" do
  File.read("Rangiwahia-Triangle-Iron.gpx")
end
