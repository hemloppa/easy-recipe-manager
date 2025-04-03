
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, doc, getDoc } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import AddRecipeForm from "../components/AddRecipeForm";
import { toast } from "sonner";

const EditRecipePage = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!recipeId || !user) return;

    const fetchRecipe = async () => {
      try {
        setIsLoading(true);
        const recipeRef = doc(db, "recipes", recipeId);
        const recipeSnap = await getDoc(recipeRef);

        if (!recipeSnap.exists()) {
          toast.error("Recipe not found");
          navigate("/");
          return;
        }

        const recipeData = recipeSnap.data();
        
        // Check if the user is the creator of the recipe
        if (recipeData.creatorId !== user.uid) {
          toast.error("You don't have permission to edit this recipe");
          navigate("/");
          return;
        }

        setRecipe(recipeData);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        toast.error("Failed to load recipe");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, user, navigate]);

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Recipe</h1>
      {recipe && <AddRecipeForm initialRecipe={recipe} isEditing={true} />}
    </div>
  );
};

export default EditRecipePage;
