class CreateContests < ActiveRecord::Migration
  def change
    create_table(:contests) do |t|
      t.string :name
      t.string :location
      t.datetime :start
      t.datetime :end
    end
  end
end
