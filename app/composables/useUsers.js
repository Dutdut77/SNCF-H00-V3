export const useUsers = () => {
  const client = useSupabaseClient();
  const { addToast } = useToast()

  const users = useState('users', () => []);

  const getAllUsers = async () => {
    try {
      // Jointure directe avec la table profil via la foreign key
      const { data, error } = await client
        .from('users')
        .select('*, profil:profils(name_profil)')
        .order('email', { ascending: true });
      
      if (error) throw error;
      
      users.value = data.map(user => ({
        ...user,
        role: user.role ?? 0,
        profils: user.profils || null,
        profil_name: user.profil?.name_profil || null,
        pre_op: user.pre_op ?? false,
        ref_du_rdu: user.ref_du_rdu ?? false,
      }));
    } catch (err) {
      addToast({
        title: "Problème lors du chargement des utilisateurs",
        message: err.message,
        type: "Error"
      });
    }
  };

  const getOneUser = async (id) => {
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('oidc_id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        role: data.role ?? 0, // 0 = aucun, 1 = admin, 2 = superadmin
        profils: data.profils || null,
      };
    } catch (err) {
      addToast({
        title: "Problème lors de la récupération de l'utilisateur",
        message: err.message,
        type: "Error"
      });
      return null;
    }
  };

  const updateUser = async (userData) => {
    try {
      const { data, error } = await client
        .from('users')
        .update({
          nom: userData.nom || null,
          prenom: userData.prenom || null,
          profils: userData.profils || null,
          role: userData.role ?? 0, // 0 = aucun, 1 = admin, 2 = superadmin
          pre_op: userData.pre_op ?? false,
          ref_du_rdu: userData.ref_du_rdu ?? false,
        })
        .eq('id', userData.id)
        .select()
        .single();
      
      if (error) throw error;
      
      addToast({
        title: "Utilisateur mis à jour",
        message: "Les modifications ont été enregistrées avec succès",
        type: "Success"
      });
      
      await getAllUsers();
      return data;
    } catch (err) {
      addToast({
        title: "Problème lors de la mise à jour",
        message: err.message,
        type: "Error"
      });
      throw err;
    }
  };

  return { getAllUsers, getOneUser, updateUser, users };
}
