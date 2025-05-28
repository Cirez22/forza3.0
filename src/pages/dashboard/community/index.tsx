import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageSquare, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import debounce from 'lodash/debounce';

type ForumCategory = {
  id: string;
  name: string;
  description: string;
};

type ForumTopic = {
  id: string;
  title: string;
  category_id: string;
  created_by: string;
  created_at: string;
  _count?: {
    posts: number;
  };
};

type ForumPost = {
  id: string;
  topic_id: string;
  content: string;
  user_id: string;
  created_at: string;
  view_count: number;
  comment_count: number;
  user: {
    email: string;
    profiles: {
      full_name: string;
    };
  };
};

const CommunityPage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchPosts(selectedTopic.id);
    }
  }, [selectedTopic]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTopics = async () => {
    try {
      let query = supabase
        .from('forum_topics')
        .select(`
          *,
          posts:forum_posts(count)
        `);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.textSearch('search_text', searchQuery);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Error al cargar los temas');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchTopics();
    }, 300),
    [selectedCategory]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const fetchPosts = async (topicId: string) => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          user:user_id (
            email,
            profiles (
              full_name
            )
          )
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Error al cargar las publicaciones');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicCategory) return;

    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .insert([
          {
            title: newTopicTitle.trim(),
            category_id: newTopicCategory,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setTopics([data, ...topics]);
      setNewTopicTitle('');
      setNewTopicCategory('');
      setShowNewTopicForm(false);
      fetchTopics();
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Error al crear el tema');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedTopic) return;

    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([
          {
            topic_id: selectedTopic.id,
            content: newPostContent.trim(),
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchPosts(selectedTopic.id);
      setNewPostContent('');
      setShowNewPostForm(false);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Error al crear la publicación');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comunidad</h1>
        <Button
          variant="primary"
          onClick={() => setShowNewTopicForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tema
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Input
          id="search"
          name="search"
          placeholder="Buscar temas y publicaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Categorías</h2>
            </div>
            <div className="divide-y divide-gray-200">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  fetchTopics();
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  !selectedCategory ? 'bg-gray-50' : ''
                }`}
              >
                Todas las categorías
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    fetchTopics();
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedCategory === category.id ? 'bg-gray-50' : ''
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topics and Posts */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Topics List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium">Temas</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedTopic?.id === topic.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {topic.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {topic._count?.posts || 0} posts
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(topic.created_at), 'dd/MM/yyyy')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts List */}
            <div className="lg:col-span-2">
              {selectedTopic ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-medium">{selectedTopic.title}</h2>
                    <Button
                      variant="primary"
                      onClick={() => setShowNewPostForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Publicación
                    </Button>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {posts.map((post) => (
                      <div key={post.id} className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {post.user.profiles?.full_name || post.user.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(post.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                            <div className="mt-2 text-sm text-gray-700">
                              {post.content}
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                {post.comment_count} comentarios
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Selecciona un tema
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Elige un tema de la lista para ver las publicaciones
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Topic Modal */}
      {showNewTopicForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Nuevo Tema</h2>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <Input
                id="topicTitle"
                name="topicTitle"
                label="Título"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <select
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTopicForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Crear Tema
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Nueva Publicación</h2>
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Escribe tu publicación..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                rows={4}
                required
              />
              <div className="mt-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewPostForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Publicar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;