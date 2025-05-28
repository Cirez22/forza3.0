import React, { useState, useEffect } from 'react';
import { Eye, ShoppingCart, ChevronDown, X, Search } from 'lucide-react';
import Button from '../../../components/common/Button';

type SygematProduct = {
  sku: string;
  name: string;
  category: string;
  urls_foto: string;
};

type SygematResponse = {
  total_count: number;
  count: number;
  art_cat_m: SygematProduct[];
};

const CatalogPage = () => {
  const [products, setProducts] = useState<SygematProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<SygematProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async (currentOffset: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://www.sygemat.com.ar/api-prod/Sygemat_Dat_dat/v1/art_cat_m?api_key=ZHwEoi7O&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar los productos');
      }

      const data: SygematResponse = await response.json();
      
      setTotalCount(data.total_count);
      setHasMore(currentOffset + data.count < data.total_count);
      
      if (currentOffset === 0) {
        setProducts(data.art_cat_m);
      } else {
        setProducts(prev => [...prev, ...data.art_cat_m]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(0);
  }, []);

  const handleLoadMore = () => {
    const newOffset = offset + 1000;
    setOffset(newOffset);
    fetchProducts(newOffset);
  };

  const getImageUrls = (urls: string): string[] => {
    return urls.split(',').filter(url => url.trim());
  };

  const handleViewImages = (product: SygematProduct) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Catálogo de Productos
            </h1>
            <p className="text-lg text-gray-600">
              Total de productos: {totalCount}
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => {
                const imageUrls = getImageUrls(product.urls_foto);
                return (
                  <tr key={`${product.sku}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative h-32 w-32 group">
                        <img
                          src={imageUrls[0] || 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg'}
                          alt={product.name}
                          className="h-full w-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg';
                          }}
                        />
                        {imageUrls.length > 1 && (
                          <button
                            onClick={() => handleViewImages(product)}
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity"
                          >
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO: Add to cart */}}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Agregar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8 mb-12">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black mr-2"></div>
            ) : (
              <ChevronDown className="w-4 h-4 mr-2" />
            )}
            Cargar más productos
          </Button>
        </div>
      )}

      {/* Image Gallery Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">{selectedProduct.name}</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={getImageUrls(selectedProduct.urls_foto)[selectedImageIndex]}
                  alt={`${selectedProduct.name} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-96 object-contain"
                />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {getImageUrls(selectedProduct.urls_foto).map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square ${
                      selectedImageIndex === index
                        ? 'ring-2 ring-black'
                        : 'hover:opacity-75'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${selectedProduct.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && offset === 0 && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;