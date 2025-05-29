import React, { useState, useEffect } from 'react';
import { Eye, ShoppingCart, ChevronDown, X, Search } from 'lucide-react';
import Button from '../../../components/common/Button';

type SygematProduct = {
  sku: string;
  sku_proveedor?: string;
  name: string;
  category: string;
  urls_foto: string;
  atributos?: string;
  precio_lista?: number;
  stock?: number;
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

  const handleViewProduct = (product: SygematProduct) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  };

  const formatAttributes = (attributes?: string) => {
    if (!attributes) return [];
    return attributes.split('|').map(attr => attr.trim()).filter(Boolean);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku_proveedor?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Artículos</h1>
            <p className="text-sm text-gray-500">
              Listado de artículos disponibles ({totalCount})
            </p>
          </div>
          <div className="w-full sm:w-auto flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProducts(0)}
              className="whitespace-nowrap"
            >
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU Prov.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
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
                  <tr 
                    key={`${product.sku}-${index}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative h-16 w-16 group cursor-pointer" onClick={() => handleViewProduct(product)}>
                        <img
                          src={imageUrls[0] || 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg'}
                          alt={product.name}
                          className="h-full w-full object-cover rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg';
                          }}
                        />
                        {imageUrls.length > 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all rounded-md">
                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku_proveedor || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md truncate">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.precio_lista 
                        ? `$${product.precio_lista.toLocaleString()}`
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProduct(product)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
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
        <div className="flex justify-center mt-8">
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">
                {selectedProduct.name}
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrls(selectedProduct.urls_foto)[selectedImageIndex]}
                      alt={`${selectedProduct.name} - Image ${selectedImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {getImageUrls(selectedProduct.urls_foto).map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative aspect-square rounded-md overflow-hidden ${
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

                {/* Product Details */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">SKU</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedProduct.sku}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">SKU Proveedor</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedProduct.sku_proveedor || '-'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Stock</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedProduct.stock || 0} unidades
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Precio Lista</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedProduct.precio_lista
                          ? `$${selectedProduct.precio_lista.toLocaleString()}`
                          : '-'
                        }
                      </p>
                    </div>
                  </div>

                  {selectedProduct.atributos && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Especificaciones
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2">
                          {formatAttributes(selectedProduct.atributos).map((attr, index) => (
                            <div 
                              key={index}
                              className="text-sm text-gray-700"
                            >
                              {attr}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={() => {/* TODO: Add to cart */}}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Agregar al carrito
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial Loading State */}
      {loading && offset === 0 && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;