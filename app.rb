#!/usr/bin/env ruby

require 'sinatra'

get "/" do
  erb :index, :locals  => { :image => "image.png" }
end

get "/gpx" do
  File.read("Rangiwahia-Triangle-Iron.gpx")
end
