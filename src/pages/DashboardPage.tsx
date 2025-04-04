
import { useState, useEffect } from "react";
import { db, doc, getDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Recipe } from "../components/RecipeCard";
import { Clock, Search, Heart, Tag, ChefHat } from "lucide-react";
import { toast } from "sonner";

const DashboardPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ searchCount: 0, favoriteCount: 0 });
  const [recipesCount, setRecipesCount] = useState(0);
  const [topTags, setTopTags] = useState<{ name: string; count: number }[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch app stats
        const statsRef = doc(db, "stats", "app_stats");
        const statsSnap = await getDoc(statsRef);
        
        if (statsSnap.exists()) {
          setStats(statsSnap.data() as { searchCount: number; favoriteCount: number });
        } else {
          // Initialize stats if they don't exist
          console.log("Stats document doesn't exist, using defaults");
          setStats({ searchCount: 0, favoriteCount: 0 });
        }

        // Get count of user's recipes - without using compound queries that need indexes
        const recipesCollectionRef = collection(db, "recipes");
        const recipesSnapshot = await getDocs(recipesCollectionRef);
        
        const userRecipes = recipesSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.creatorId === user.uid || data.userId === user.uid;
        });
        
        setRecipesCount(userRecipes.length);

        // Get user's recent recipes - avoiding the compound query that needs an index
        const userRecentRecipes = userRecipes
          .map(doc => doc.data() as Recipe)
          .sort((a, b) => {
            // Handle both Timestamp objects and server timestamps that might be dates
            const getDateValue = (timestamp: any): Date => {
              if (timestamp instanceof Timestamp) {
                return timestamp.toDate();
              } else if (timestamp && typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
              } else if (timestamp) {
                return new Date(timestamp);
              }
              return new Date(0);
            };
            
            const aDate = getDateValue(a.createdAt);
            const bDate = getDateValue(b.createdAt);
            
            return bDate.getTime() - aDate.getTime();
          })
          .slice(0, 5);
        
        setRecentRecipes(userRecentRecipes);

        // Calculate top tags from all recipes
        const allRecipes = recipesSnapshot.docs.map(doc => doc.data() as Recipe);
        
        const tagCounts: Record<string, number> = {};
        allRecipes.forEach(recipe => {
          if (recipe.tags && Array.isArray(recipe.tags)) {
            recipe.tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });

        const sortedTags = Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopTags(sortedTags);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Calculate total for pie chart percentage
  const total = stats.searchCount + stats.favoriteCount + recipesCount;
  const pieData = [
    { name: 'Searches', value: stats.searchCount || 1 }, // Ensure at least 1 to avoid empty chart
    { name: 'Favorites', value: stats.favoriteCount || 1 },
    { name: 'Recipes', value: recipesCount || 1 }
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-3">
            <ChefHat size={24} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">My Recipes</p>
            <p className="text-2xl font-bold">{recipesCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-3">
            <Search size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Searches</p>
            <p className="text-2xl font-bold">{stats.searchCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-red-100 p-3 rounded-full mr-3">
            <Heart size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Favorites</p>
            <p className="text-2xl font-bold">{stats.favoriteCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-purple-100 p-3 rounded-full mr-3">
            <Tag size={24} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Popular Tags</p>
            <p className="text-2xl font-bold">{topTags.length}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Popular Tags</h2>
          {topTags.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No tags found. Add tags to your recipes!
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topTags}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4ade80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">App Usage</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => {
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return `${name} ${percentage}%`;
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => total > 0 ? `${Math.round((Number(value) / total) * 100)}%` : '0%'} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Recipes */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Your Recent Recipes</h2>
        {recentRecipes.length === 0 ? (
          <p className="text-gray-500">You haven't created any recipes yet.</p>
        ) : (
          <div className="space-y-2">
            {recentRecipes.map((recipe) => (
              <div key={recipe.recipe_id} className="flex items-center p-3 hover:bg-gray-50 rounded">
                <div className="mr-3">
                  <Clock size={20} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{recipe.title}</h3>
                  <p className="text-sm text-gray-500">
                    {recipe.ingredients?.length || 0} ingredients • {recipe.tags?.join(", ") || "No tags"}
                  </p>
                </div>
                <div>
                  <a 
                    href={`/edit-recipe/${recipe.recipe_id}`}
                    className="text-sm text-green-500 hover:text-green-700"
                  >
                    Edit
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
