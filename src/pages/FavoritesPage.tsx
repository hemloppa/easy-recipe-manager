
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { db, doc, getDoc, collection, query, where, getDocs } from "../lib/firebase";
import RecipeCard, { Recipe } from "../components/RecipeCard";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        // Get user's favorite recipe IDs
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          toast.error("User data not found");
          setIsLoading(false);
          return;
        }
        
        const userData = userDoc.data();
        const favoriteIds = userData.favorites || [];
        setFavoriteIds(favoriteIds);

        if (favoriteIds.length === 0) {
          setFavorites([]);
          setIsLoading(false);
          return;
        }

        // Fetch the recipes in batches (Firestore "in" query has limits)
        const batchSize = 10;
        let allFavorites: Recipe[] = [];

        for (let i = 0; i < favoriteIds.length; i += batchSize) {
          const batch = favoriteIds.slice(i, i + batchSize);
          const recipesQuery = query(
            collection(db, "recipes"),
            where("recipe_id", "in", batch)
          );
          
          const recipesDocs = await getDocs(recipesQuery);
          const batchFavorites = recipesDocs.docs.map(doc => doc.data() as Recipe);
          allFavorites = [...allFavorites, ...batchFavorites];
        }

        setFavorites(allFavorites);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        toast.error("Failed to load favorites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const updateFavorites = (recipeId: string, isFavorite: boolean) => {
    setFavoriteIds(prev => 
      isFavorite 
        ? [...prev, recipeId] 
        : prev.filter(id => id !== recipeId)
    );
    
    setFavorites(prev => 
      isFavorite 
        ? prev 
        : prev.filter(recipe => recipe.recipe_id !== recipeId)
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Favorite Recipes</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't saved any favorite recipes yet.</p>
          <button 
            onClick={() => navigate("/")} 
            className="btn-primary inline-flex items-center"
          >
            <PlusCircle size={18} className="mr-1" /> Find Recipes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((recipe) => (
            <RecipeCard
              key={recipe.recipe_id}
              recipe={recipe}
              isFavorite={true}
              updateFavorites={updateFavorites}
              refreshRecipes={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
