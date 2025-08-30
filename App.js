import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context'; // Importação do SafeAreaView mantida

// Contexto para gerenciar o estado do inventário, carrinho e transações globalmente
const InventoryContext = createContext();
const Tab = createBottomTabNavigator();

// Paleta de cores em tons de laranja para React Native StyleSheet
const Colors = {
  primary: '#F97316',      // Laranja Escuro
  primaryText: '#FFFFFF',
  secondary: '#FB923C',    // Laranja
  accent: '#FDBA74',       // Laranja Claro
  background: '#FFF8F0',   // Laranja Muito Claro
  text: '#333333',         // Cinza Escuro
  lightText: '#FFFFFF',    // Branco
  danger: '#EF4444',       // Vermelho para ações perigosas
  success: '#22C55E',      // Verde para sucesso
  border: '#FDBA74',
  shadowColor: '#000',
};

const commonStyles = StyleSheet.create({
  shadow: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
  },
  accentButton: {
    backgroundColor: Colors.accent,
  },
  dangerButton: {
    backgroundColor: Colors.danger,
  },
  successButton: {
    backgroundColor: Colors.success,
  },
  buttonText: {
    color: Colors.lightText,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    color: Colors.text,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  picker: {
    width: '100%',
    height: 50,
    marginBottom: 16,
    borderRadius: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    color: Colors.text,
    backgroundColor: '#FFFFFF',
  },
});

// --- Funções de Armazenamento Local (para React Native) ---
const STORAGE_KEY_INVENTORY = 'inventory_app:inventory';
const STORAGE_KEY_CART = 'inventory_app:cart';
const STORAGE_KEY_TRANSACTIONS = 'inventory_app:transactions';
const STORAGE_KEY_FIXED_TAXES = 'inventory_app:fixed_taxes';

const saveToStorage = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    console.log(`AsyncStorage: ${key} salvo`, data);
  } catch (error) {
    console.error(`Erro ao salvar ${key} no AsyncStorage:`, error);
  }
};

const loadFromStorage = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    const loaded = jsonValue != null ? JSON.parse(jsonValue) : [];
    console.log(`AsyncStorage: ${key} carregado`, loaded);
    return loaded;
  } catch (error) {
    console.error(`Erro ao carregar ${key} do AsyncStorage:`, error);
    return [];
  }
};

// Helper para calcular o valor da taxa
const calculateAmountFromPercentage = (baseAmount, percentage) => {
  return baseAmount * (percentage / 100);
};

// Helper para calcular o valor do desconto
const calculateDiscountValue = (total, discount) => {
  if (!discount || discount.value === 0) return 0;
  if (discount.type === 'percentage') {
    return total * (discount.value / 100);
  }
  return discount.value;
};

// --- Componente de Item do Produto ---
const ProductItem = ({ product, onAddToCart, onEditProduct }) => {
  return (
    <View style={[styles.productItemContainer, commonStyles.shadow]}>
      <View style={styles.productItemDetails}>
        <Text style={styles.productItemName}>{product.name}</Text>
        <Text style={styles.productItemText}>Estoque: {product.stock}</Text>
        <Text style={styles.productItemText}>Preço: R$ {product.price.toFixed(2)}</Text>
      </View>
      <View style={styles.productItemActions}>
        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.primaryButton, { width: 40, height: 40, borderRadius: 20 }]}
          onPress={() => onAddToCart(product)}
          disabled={product.stock === 0}
        >
          <Text style={commonStyles.buttonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.accentButton, { height: 40 }]} // minWidth removido para flexibilidade
          onPress={() => onEditProduct(product)}
        >
          <Text style={commonStyles.buttonText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Componente Modal (para Adicionar/Editar Produto) ---
const ProductModal = ({
  modalVisible,
  setModalVisible,
  currentProduct,
  setProductName,
  setProductStock,
  setProductPrice,
  handleSaveProduct,
  handleDeleteProduct,
  productName,
  productStock,
  productPrice,
}) => {
  const closeModal = () => {
    setModalVisible(false);
    setProductName('');
    setProductStock('');
    setProductPrice('');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, commonStyles.shadow]}>
          <Text style={styles.modalTitle}>
            {currentProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </Text>
          <TextInput
            placeholder="Nome do Produto"
            value={productName}
            onChangeText={setProductName}
            style={commonStyles.input}
          />
          <TextInput
            placeholder="Estoque"
            value={productStock.toString()}
            onChangeText={(text) => setProductStock(text)}
            keyboardType="numeric"
            style={commonStyles.input}
          />
          <TextInput
            placeholder="Preço (R$)"
            value={productPrice.toString()}
            onChangeText={(text) => setProductPrice(text)}
            keyboardType="numeric"
            style={commonStyles.input}
          />

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[commonStyles.buttonBase, commonStyles.dangerButton, {flex: 1, marginRight: 8}]}
              onPress={closeModal}
            >
              <Text style={commonStyles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            {currentProduct && (
              <TouchableOpacity
                style={[commonStyles.buttonBase, commonStyles.dangerButton, {flex: 1, marginRight: 8}]}
                onPress={() => {
                  Alert.alert(
                    "Confirmar Exclusão",
                    "Tem certeza de que deseja excluir este produto?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Excluir", onPress: () => { handleDeleteProduct(currentProduct.id); closeModal(); } }
                    ]
                  );
                }}
              >
                <Text style={commonStyles.buttonText}>Excluir</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[commonStyles.buttonBase, commonStyles.primaryButton, {flex: 1}]}
              onPress={handleSaveProduct}
            >
              <Text style={commonStyles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Componente Modal para Importação de Produtos ---
const ImportProductsModal = ({ modalVisible, setModalVisible, onImportProducts }) => {
  const [csvData, setCsvData] = useState('');

  const handleImport = () => {
    if (!csvData) {
      Alert.alert('Erro', 'Por favor, cole os dados CSV no campo.');
      return;
    }
    onImportProducts(csvData);
    setCsvData('');
    setModalVisible(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, commonStyles.shadow]}>
          <Text style={styles.modalTitle}>Importar Produtos (CSV)</Text>
          <TextInput
            placeholder="Cole seus dados CSV aqui (Nome,Estoque,Preço)"
            value={csvData}
            onChangeText={setCsvData}
            multiline={true}
            numberOfLines={10}
            style={[commonStyles.input, { height: 150 }]}
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[commonStyles.buttonBase, commonStyles.dangerButton, {flex: 1, marginRight: 8}]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={commonStyles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.buttonBase, commonStyles.primaryButton, {flex: 1}]}
              onPress={handleImport}
            >
              <Text style={commonStyles.buttonText}>Importar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Tela de Inventário ---
const InventoryScreen = () => {
  const { inventory, addProduct, updateProduct, deleteProduct, addToCart, clearAllInventory } = useContext(InventoryContext);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productName, setProductName] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const filteredProducts = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (searchTerm.length > 0) {
      const matchingSuggestions = inventory
        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(item => item.name)
        .slice(0, 5);
      setSuggestions(matchingSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, inventory]);

  const handleSaveProduct = () => {
    if (!productName || productStock === '' || productPrice === '') {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    const newProduct = {
      id: currentProduct ? currentProduct.id : Date.now().toString(),
      name: productName,
      stock: parseInt(productStock, 10),
      price: parseFloat(productPrice),
    };

    if (currentProduct) {
      updateProduct(newProduct);
    } else {
      addProduct(newProduct);
    }
    setProductModalVisible(false);
    setCurrentProduct(null);
    setProductName('');
    setProductStock('');
    setProductPrice('');
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setProductName(product.name);
    setProductStock(product.stock.toString());
    setProductPrice(product.price.toFixed(2));
    setProductModalVisible(true);
  };

  const handleDeleteProduct = (id) => {
    deleteProduct(id);
  };

  const handleImportProducts = (csvData) => {
    const lines = csvData.trim().split('\n');
    const newProducts = [];
    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 3) {
        const [name, stock, price] = parts;
        newProducts.push({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: name.trim(),
          stock: parseInt(stock.trim(), 10),
          price: parseFloat(price.trim()),
        });
      }
    });
    newProducts.forEach(product => addProduct(product));
    Alert.alert('Sucesso', `${newProducts.length} produtos importados com sucesso!`);
  };

  const generateInventoryCSV = (data) => {
    const header = ['ID', 'Nome', 'Estoque', 'Preço'];
    const rows = data.map(p => {
      return [
        p.id,
        p.name,
        p.stock,
        p.price.toFixed(2),
      ].join(',');
    });
    return [header.join(','), ...rows].join('\n');
  };

  const downloadInventory = () => {
    if (inventory.length === 0) {
      Alert.alert('Aviso', 'Nenhum produto no inventário para baixar.');
      return;
    }
    const csv = generateInventoryCSV(inventory);
    console.log('CSV de inventário gerado:', csv);
    Alert.alert('Download CSV', 'A funcionalidade de download de CSV requer módulos nativos em React Native (ex: react-native-fs ou expo-sharing). O CSV foi gerado e logado no console.');
    // Ex: Linking.openURL('data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    // Or use libraries like expo-sharing: Sharing.shareAsync(uri)
  };

  const handleClearAllInventory = () => {
    Alert.alert(
      "Confirmar Limpeza",
      "ATENÇÃO: Tem certeza que deseja apagar TODO o inventário? Esta ação é irreversível!",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", onPress: () => { clearAllInventory(); Alert.alert('Sucesso', 'Inventário limpo com sucesso!'); } }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.screenContent}>
        <Text style={styles.screenTitle}>Inventário</Text>

        {/* Campo de busca com Autocomplete */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Pesquisar produto por nome..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={commonStyles.input}
          />
          {suggestions.length > 0 && searchTerm.length > 0 && (
            <View style={[styles.suggestionsContainer, commonStyles.shadow]}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearchTerm(suggestion);
                    setSuggestions([]);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <ProductItem
              product={item}
              onAddToCart={addToCart}
              onEditProduct={handleEditProduct}
            />
          )}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              {searchTerm ? 'Nenhum produto encontrado para o termo de busca.' : 'Nenhum produto no inventário.'}
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[commonStyles.buttonBase, commonStyles.primaryButton, { flex: 1, marginRight: 8 }]}
            onPress={() => {
              setCurrentProduct(null);
              setProductModalVisible(true);
            }}
          >
            <Text style={commonStyles.buttonText}>Adicionar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[commonStyles.buttonBase, commonStyles.secondaryButton, { flex: 1, marginRight: 8 }]}
            onPress={() => setImportModalVisible(true)}
          >
            <Text style={commonStyles.buttonText}>Importar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[commonStyles.buttonBase, commonStyles.secondaryButton, { flex: 1 }]}
            onPress={downloadInventory}
          >
            <Text style={commonStyles.buttonText}>Exportar</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.dangerButton, { width: '100%', marginTop: 10 }]}
          onPress={handleClearAllInventory}
        >
          <Text style={commonStyles.buttonText}>Limpar Inventário</Text>
        </TouchableOpacity>


        <ProductModal
          modalVisible={productModalVisible}
          setModalVisible={setProductModalVisible}
          currentProduct={currentProduct}
          setProductName={setProductName}
          setProductStock={setProductStock}
          setProductPrice={setProductPrice}
          handleSaveProduct={handleSaveProduct}
          handleDeleteProduct={handleDeleteProduct}
          productName={productName}
          productStock={productStock}
          productPrice={productPrice}
        />

        <ImportProductsModal
          modalVisible={importModalVisible}
          setModalVisible={setImportModalVisible}
          onImportProducts={handleImportProducts}
        />
      </View>
    </SafeAreaView>
  );
};

// --- Componente de Item do Carrinho ---
const CartItem = ({ item, onUpdateQuantity, onRemoveFromCart }) => {
  const productPrice = item.price;
  const itemTotal = productPrice * item.quantity;

  return (
    <View style={[styles.cartItemContainer, commonStyles.shadow]}>
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemText}>Preço Unitário: R$ {productPrice.toFixed(2)}</Text>
        <Text style={styles.cartItemText}>Quantidade: {item.quantity}</Text>
        <Text style={styles.cartItemTotal}>Total: R$ {itemTotal.toFixed(2)}</Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.primaryButton, { width: 40, height: 40, borderRadius: 20, marginRight: 8 }]}
          onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <Text style={commonStyles.buttonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.primaryButton, { width: 40, height: 40, borderRadius: 20, marginRight: 8 }]}
          onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          <Text style={commonStyles.buttonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.dangerButton, { width: 40, height: 40, borderRadius: 20 }]}
          onPress={() => onRemoveFromCart(item.id)}
        >
          <Text style={commonStyles.buttonText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Componente Modal para Gerenciar Taxas Fixas ---
const FixedTaxManagerModal = ({ modalVisible, setModalVisible }) => {
  const { fixedTaxes, addFixedTax, updateFixedTax, deleteFixedTax } = useContext(InventoryContext);
  const [taxName, setTaxName] = useState('');
  const [taxValue, setTaxValue] = useState('');
  const [taxType, setTaxType] = useState('value');
  const [editingTax, setEditingTax] = useState(null);

  useEffect(() => {
    if (!modalVisible) {
      setEditingTax(null);
      setTaxName('');
      setTaxValue('');
      setTaxType('value');
    } else if (editingTax) {
      setTaxName(editingTax.name);
      setTaxValue(editingTax.value.toString());
      setTaxType(editingTax.type);
    }
  }, [modalVisible, editingTax]);

  const handleSaveTax = () => {
    if (!taxName || taxValue === '') {
      Alert.alert('Erro', 'Por favor, preencha todos os campos da taxa.');
      return;
    }
    const newTax = {
      id: editingTax ? editingTax.id : Date.now().toString(),
      name: taxName,
      value: parseFloat(taxValue),
      type: taxType,
    };

    if (editingTax) {
      updateFixedTax(newTax);
    } else {
      addFixedTax(newTax);
    }
    setModalVisible(false);
  };

  const handleEditTax = (tax) => {
    setEditingTax(tax);
    setModalVisible(true);
  };

  const handleDeleteTax = (id) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta taxa fixa?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", onPress: () => { deleteFixedTax(id); Alert.alert('Sucesso', 'Taxa excluída!'); } }
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, commonStyles.shadow, { height: 'auto', maxHeight: '90%' }]}>
          <Text style={styles.modalTitle}>Gerenciar Taxas Fixas</Text>

          <ScrollView style={styles.fixedTaxListContainer}>
            {fixedTaxes.length === 0 ? (
              <Text style={styles.emptyListText}>Nenhuma taxa fixa cadastrada.</Text>
            ) : (
              fixedTaxes.map(tax => (
                <View key={tax.id} style={styles.fixedTaxItem}>
                  <Text style={styles.fixedTaxItemText}>
                    {tax.name}: {tax.type === 'percentage' ? `${tax.value}%` : `R$ ${tax.value.toFixed(2)}`}
                  </Text>
                  <View style={styles.fixedTaxItemActions}>
                    <TouchableOpacity
                      style={[commonStyles.buttonBase, commonStyles.accentButton, { width: 60, height: 30, marginRight: 8 }]}
                      onPress={() => handleEditTax(tax)}
                    >
                      <Text style={[commonStyles.buttonText, { fontSize: 12 }]}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[commonStyles.buttonBase, commonStyles.dangerButton, { width: 60, height: 30 }]}
                      onPress={() => handleDeleteTax(tax.id)}
                    >
                      <Text style={[commonStyles.buttonText, { fontSize: 12 }]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <Text style={styles.modalSubTitle}>
            {editingTax ? 'Editar Taxa' : 'Adicionar Nova Taxa'}
          </Text>
          <TextInput
            placeholder="Nome da Taxa"
            value={taxName}
            onChangeText={setTaxName}
            style={commonStyles.input}
          />
          <View style={styles.pickerContainer}>
            <TextInput
              placeholder="Valor da Taxa"
              value={taxValue}
              onChangeText={setTaxValue}
              keyboardType="numeric"
              style={[commonStyles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
            />
            <Picker
              selectedValue={taxType}
              onValueChange={(itemValue) => setTaxType(itemValue)}
              style={[commonStyles.picker, { flex: 0.5, marginBottom: 0 }]}
            >
              <Picker.Item label="R$" value="value" />
              <Picker.Item label="%" value="percentage" />
            </Picker>
          </View>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[commonStyles.buttonBase, commonStyles.dangerButton, {flex: 1, marginRight: 8}]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={commonStyles.buttonText}>Fechar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.buttonBase, commonStyles.primaryButton, {flex: 1}]}
              onPress={handleSaveTax}
            >
              <Text style={commonStyles.buttonText}>{editingTax ? 'Atualizar' : 'Adicionar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


// --- Tela do Carrinho ---
const CartScreen = ({ navigation }) => {
  const { cart, updateCartItemQuantity, removeFromCart, checkout, inventory, setDiscount, discount, fixedTaxes } = useContext(InventoryContext);
  const [discountValueInput, setDiscountValueInput] = useState(discount.value > 0 ? discount.value.toString() : '');
  const [discountTypeInput, setDiscountTypeInput] = useState(discount.type);
  const [selectedFixedTaxes, setSelectedFixedTaxes] = useState([]);
  const [fixedTaxManagerModalVisible, setFixedTaxManagerModalVisible] = useState(false);

  useEffect(() => {
    setDiscountValueInput(discount.value > 0 ? discount.value.toString() : '');
    setDiscountTypeInput(discount.type);
  }, [discount]);

  useEffect(() => {
    console.log('CartScreen: Estado atual do carrinho:', cart);
    console.log('CartScreen: Estado atual do inventário:', inventory);
    console.log('CartScreen: Desconto atual:', discount);
    console.log('CartScreen: Taxas fixas selecionadas:', selectedFixedTaxes);
  }, [cart, inventory, discount, selectedFixedTaxes]);

  const handleSelectFixedTax = (tax) => {
    setSelectedFixedTaxes(prev =>
      prev.some(t => t.id === tax.id)
        ? prev.filter(t => t.id !== tax.id)
        : [...prev, tax]
    );
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const appliedDiscountValue = calculateDiscountValue(subtotal, discount);
  const subtotalAfterDiscount = subtotal - appliedDiscountValue;

  let totalTaxAmount = 0;
  selectedFixedTaxes.forEach(tax => {
    if (tax.type === 'percentage') {
      totalTaxAmount += calculateAmountFromPercentage(subtotalAfterDiscount, tax.value);
    } else {
      totalTaxAmount += tax.value;
    }
  });

  const totalFinal = subtotalAfterDiscount + totalTaxAmount;


  const handleApplyDiscount = () => {
    if (discountValueInput === '') {
      setDiscount({ value: 0, type: 'value' });
      Alert.alert('Sucesso', 'Desconto removido.');
      return;
    }
    const value = parseFloat(discountValueInput);
    if (isNaN(value) || value < 0) {
      Alert.alert('Erro', 'Por favor, insira um valor de desconto válido.');
      return;
    }
    setDiscount({ value: value, type: discountTypeInput });
    Alert.alert('Sucesso', 'Desconto aplicado!');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Carrinho Vazio', 'Adicione itens ao carrinho antes de finalizar a compra.');
      return;
    }

    const stockCheckPassed = cart.every(cartItem => {
      const productInInventory = inventory.find(invItem => invItem.id === cartItem.id);
      return productInInventory && productInInventory.stock >= cartItem.quantity;
    });

    if (!stockCheckPassed) {
      Alert.alert('Estoque Insuficiente', 'Um ou mais produtos no seu carrinho não têm estoque suficiente.');
      return;
    }

    Alert.alert(
      "Confirmar Compra",
      `O total da sua compra é R$ ${totalFinal.toFixed(2)}. Deseja prosseguir?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => {
            console.log('CartScreen: Iniciando checkout...');
            checkout(totalFinal, subtotal, appliedDiscountValue, discount, selectedFixedTaxes, totalTaxAmount);
            navigation.navigate('Inventário'); // Navegar de volta para a aba principal (Inventário)
            setSelectedFixedTaxes([]);
            Alert.alert('Sucesso', 'Sua compra foi finalizada com sucesso!');
          }
        }
      ]
    );
  };

  // Componente de rodapé para a FlatList do carrinho
  const CartFooter = () => (
    <View style={[styles.cartSummaryContainer, commonStyles.shadow]}>
      <Text style={styles.cartSummaryText}>Subtotal: R$ {subtotal.toFixed(2)}</Text>

      {/* Campo de Desconto */}
      <View style={styles.discountInputContainer}>
        <TextInput
          placeholder="Valor do Desconto"
          value={discountValueInput}
          onChangeText={setDiscountValueInput}
          keyboardType="numeric"
          style={[commonStyles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
        />
        <Picker
          selectedValue={discountTypeInput}
          onValueChange={(itemValue) => setDiscountTypeInput(itemValue)}
          style={[commonStyles.picker, { flex: 0.5, marginBottom: 0 }]}
        >
          <Picker.Item label="R$" value="value" />
          <Picker.Item label="%" value="percentage" />
        </Picker>
        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.secondaryButton, { marginLeft: 8 }]}
          onPress={handleApplyDiscount}
        >
          <Text style={commonStyles.buttonText}>Aplicar</Text>
        </TouchableOpacity>
      </View>

      {appliedDiscountValue > 0 && (
        <Text style={styles.cartSummaryText}>Desconto Aplicado: R$ {appliedDiscountValue.toFixed(2)}</Text>
      )}
      <Text style={styles.cartSummaryText}>Subtotal após Desconto: R$ {subtotalAfterDiscount.toFixed(2)}</Text>

      {/* Gerenciar Taxas Fixas */}
      <TouchableOpacity
        style={[commonStyles.buttonBase, commonStyles.accentButton, { width: '100%', marginTop: 16 }]}
        onPress={() => setFixedTaxManagerModalVisible(true)}
      >
        <Text style={commonStyles.buttonText}>Gerenciar Taxas Fixas</Text>
      </TouchableOpacity>

      {/* Seleção de Taxas Fixas Aplicáveis */}
      {fixedTaxes.length > 0 && (
        <View style={styles.taxesSelectionContainer}>
          <Text style={styles.itemTitle}>Aplicar Taxas:</Text>
          <View style={styles.taxButtonsWrapper}>
            {fixedTaxes.map(tax => (
              <TouchableOpacity
                key={tax.id}
                style={[
                  styles.taxButton,
                  selectedFixedTaxes.some(t => t.id === tax.id)
                    ? commonStyles.primaryButton
                    : { backgroundColor: '#E5E7EB' } // gray-200
                ]}
                onPress={() => handleSelectFixedTax(tax)}
              >
                <Text style={[styles.taxButtonText, selectedFixedTaxes.some(t => t.id === tax.id) ? commonStyles.buttonText : { color: Colors.text }]}>
                  {tax.name} {tax.type === 'percentage' ? `(${tax.value}%)` : `(R$ ${tax.value.toFixed(2)})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {totalTaxAmount > 0 && (
        <Text style={styles.cartSummaryText}>Total de Impostos: R$ {totalTaxAmount.toFixed(2)}</Text>
      )}
      <Text style={styles.cartFinalTotal}>Total Final: R$ {totalFinal.toFixed(2)}</Text>
      <TouchableOpacity
        style={[commonStyles.buttonBase, commonStyles.successButton, { width: '100%', marginTop: 16 }]}
        onPress={handleCheckout}
        disabled={cart.length === 0}
      >
        <Text style={commonStyles.buttonText}>Finalizar Compra</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.screenContent}>
        <Text style={styles.screenTitle}>Carrinho</Text>
        <FlatList
          data={cart}
          renderItem={({ item }) => (
            <CartItem
              item={item}
              onUpdateQuantity={updateCartItemQuantity}
              onRemoveFromCart={removeFromCart}
            />
          )}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>Seu carrinho está vazio.</Text>
          }
          ListFooterComponent={CartFooter} // Adicionando o rodapé da lista aqui
          contentContainerStyle={{ paddingBottom: 20 }}
        />
        {/* O Modal de Gerenciamento de Taxas Fixas permanece aqui, pois ele flutua sobre a tela */}
        <FixedTaxManagerModal modalVisible={fixedTaxManagerModalVisible} setModalVisible={setFixedTaxManagerModalVisible} />
      </View>
    </SafeAreaView>
  );
};

// --- Tela de Transações ---
const TransactionsScreen = () => {
  const { transactions, clearTransactions } = useContext(InventoryContext);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterWeek, setFilterWeek] = useState(false);

  // Nomes dos meses em português (1-indexado visualmente)
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Função revisada para obter a segunda-feira da semana
  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Normaliza para o início do dia
    const dayOfWeek = d.getDay(); // 0 para Domingo, 1 para Segunda...
    // Calcula quantos dias subtrair para chegar na Segunda-feira
    const daysToSubtract = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Se for domingo (0), volta 6 dias. Senão, volta (dayOfWeek - 1) dias.
    d.setDate(d.getDate() - daysToSubtract);
    return d;
  };

  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);

    // Depuração para o filtro de mês
    console.log(`--- Transação ID: ${t.id} ---`);
    console.log(`Data da Transação (ISO): ${t.date}`);
    console.log(`Data da Transação (Objeto Date): ${transactionDate}`);
    console.log(`Mês da Transação (getUTCMonth + 1): ${transactionDate.getUTCMonth() + 1}`); // Usando getUTCMonth()
    console.log(`Valor de filterMonth: '${filterMonth}'`);

    // Usa getUTCMonth() para consistência com toISOString()
    const monthMatch = filterMonth ? (transactionDate.getUTCMonth() + 1).toString() === filterMonth : true;
    console.log(`monthMatch: ${monthMatch}`);

    let weekMatch = true;
    if (filterWeek) {
      const startOfTransactionWeek = getMondayOfWeek(transactionDate);
      const startOfCurrentWeek = getMondayOfWeek(new Date());

      // Depuração para o filtro de semana
      console.log(`Filtrar por Semana Ativa: ${filterWeek}`);
      console.log(`Início da Semana da Transação: ${startOfTransactionWeek.toISOString()}`);
      console.log(`Início da Semana Atual: ${startOfCurrentWeek.toISOString()}`);

      weekMatch = startOfTransactionWeek.getTime() === startOfCurrentWeek.getTime();
      console.log(`weekMatch: ${weekMatch}`);
    } else {
      console.log(`Filtrar por Semana Ativa: ${filterWeek} (ignorado)`);
    }

    console.log(`Resultado Final do Filtro (monthMatch && weekMatch): ${monthMatch && weekMatch}`);
    return monthMatch && weekMatch;
  });

  console.log(`Total de Transações Filtradas: ${filteredTransactions.length}`); // Log do total de transações filtradas


  const generateCSV = (data) => {
    const header = ['ID', 'Data', 'Subtotal', 'Desconto Aplicado', 'Tipo Desconto', 'Valor Desconto', 'Total Taxas Aplicadas', 'Total Final', 'Itens'];
    const rows = data.map(t => {
      const itemsString = t.items.map(item => `${item.name} (x${item.quantity}, R$ ${item.price.toFixed(2)} unit., Total Item: R$ ${(item.price * item.quantity).toFixed(2)})`).join('; ');
      const taxesAppliedString = t.appliedFixedTaxes.map(tax => `${tax.name} (${tax.type === 'percentage' ? `${tax.value}%` : `R$ ${tax.value.toFixed(2)}`})`).join('; ');

      return [
        t.id,
        new Date(t.date).toLocaleString(),
        t.subtotal.toFixed(2),
        t.appliedDiscountValue.toFixed(2),
        t.discount.type === 'percentage' ? `${t.discount.value}%` : `R$ ${t.discount.value.toFixed(2)}`,
        t.discount.value.toFixed(2),
        t.totalTaxAmount.toFixed(2),
        t.total.toFixed(2),
        itemsString
      ].join(',');
    });
    return [header.join(','), ...rows].join('\n');
  };

  const downloadTransactions = () => {
    console.log('downloadTransactions: Iniciando função de download...');
    console.log('downloadTransactions: Transações filtradas:', filteredTransactions);

    if (filteredTransactions.length === 0) {
      Alert.alert('Aviso', 'Nenhuma transação para baixar com os filtros atuais.');
      console.log('downloadTransactions: Nenhuma transação para baixar. Abortando.');
      return;
    }

    const csv = generateCSV(filteredTransactions);
    console.log('downloadTransactions: CSV gerado:', csv);

    Alert.alert('Download CSV', 'A funcionalidade de download de CSV requer módulos nativos em React Native (ex: react-native-fs ou expo-sharing). O CSV foi gerado e logado no console.');
    // Ex: Linking.openURL('data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    // Or use libraries like expo-sharing: Sharing.shareAsync(uri)
  };

  const handleClearTransactions = () => {
    Alert.alert(
      "Confirmar Limpeza",
      "Tem certeza que deseja limpar TODOS os dados de transações? Esta ação é irreversível!",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", onPress: () => { clearTransactions(); Alert.alert('Sucesso', 'Dados de transações limpos com sucesso!'); } }
      ]
    );
  };

  const renderTransactionItem = ({ item: t }) => (
    <View style={[styles.transactionCard, commonStyles.shadow]}>
      <Text style={styles.transactionId}>ID da Transação: {t.id}</Text>
      <Text style={styles.transactionDetail}>Data: {new Date(t.date).toLocaleString()}</Text>
      <Text style={styles.transactionDetail}>Subtotal: R$ {t.subtotal.toFixed(2)}</Text>
      {t.appliedDiscountValue > 0 && <Text style={styles.transactionDetail}>Desconto Aplicado: R$ {t.appliedDiscountValue.toFixed(2)}</Text>}
      {t.totalTaxAmount > 0 && <Text style={styles.transactionDetail}>Taxas Aplicadas: R$ {t.totalTaxAmount.toFixed(2)}</Text>}
      <Text style={styles.transactionId}>Total Final: R$ {t.total.toFixed(2)}</Text>

      <Text style={styles.itemTitle}>Itens:</Text>
      <View>
        {t.items.map(item => (
          <View key={item.id} style={styles.listItem}>
            <Text style={styles.listItemText}>
              • {item.name} (x{item.quantity}, R$ {item.price.toFixed(2)} unit., Total Item: R$ ${(item.price * item.quantity).toFixed(2)})
            </Text>
          </View>
        ))}
      </View>

      {t.appliedFixedTaxes && t.appliedFixedTaxes.length > 0 && (
        <>
          <Text style={styles.itemTitle}>Taxas Fixas Aplicadas:</Text>
          <View>
            {t.appliedFixedTaxes.map(tax => (
              <View key={tax.id} style={styles.listItem}>
                <Text style={styles.listItemText}>
                  • {tax.name} ({tax.type === 'percentage' ? `${tax.value}%` : `R$ ${tax.value.toFixed(2)}`})
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.screenContent}>
        <Text style={styles.screenTitle}>Transações</Text>

        <View style={styles.filterContainer}>
          <Picker
            selectedValue={filterMonth}
            onValueChange={(itemValue) => setFilterMonth(itemValue)}
            style={[commonStyles.picker, { flex: 1, marginRight: 8 }]}
          >
            <Picker.Item label="Todos os Meses" value="" />
            {monthNames.map((name, index) => (
              <Picker.Item key={index + 1} label={name} value={(index + 1).toString()} />
            ))}
          </Picker>
          <TouchableOpacity
            style={[commonStyles.buttonBase, filterWeek ? commonStyles.primaryButton : commonStyles.secondaryButton, { paddingHorizontal: 10 }]}
            onPress={() => setFilterWeek(prev => !prev)}
          >
            <Text style={commonStyles.buttonText}>
              {filterWeek ? 'Semana Atual: Ativo' : 'Filtrar por Semana Atual'}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>Nenhuma transação encontrada.</Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.successButton, { width: '100%', marginTop: 10 }]}
          onPress={downloadTransactions}
          disabled={filteredTransactions.length === 0}
        >
          <Text style={commonStyles.buttonText}>Baixar Transações (CSV)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.buttonBase, commonStyles.dangerButton, { width: '100%', marginTop: 10 }]}
          onPress={handleClearTransactions}
        >
          <Text style={commonStyles.buttonText}>Limpar Transações</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


// --- Provedor de Contexto do Inventário ---
const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fixedTaxes, setFixedTaxes] = useState([]);
  const [discount, setDiscount] = useState({ value: 0, type: 'value' });
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitialData(true);
      const loadedInventory = await loadFromStorage(STORAGE_KEY_INVENTORY);
      const loadedCart = await loadFromStorage(STORAGE_KEY_CART);
      const loadedTransactions = await loadFromStorage(STORAGE_KEY_TRANSACTIONS);
      const loadedFixedTaxes = await loadFromStorage(STORAGE_KEY_FIXED_TAXES);
      setInventory(loadedInventory);
      setCart(loadedCart);
      setTransactions(loadedTransactions);
      setFixedTaxes(loadedFixedTaxes);
      setLoadingInitialData(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_INVENTORY, inventory);
  }, [inventory]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_CART, cart);
  }, [cart]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_FIXED_TAXES, fixedTaxes);
  }, [fixedTaxes]);

  // Ações de Inventário
  const addProduct = (product) => {
    setInventory((prev) => [...prev, product]);
  };

  const updateProduct = (updatedProduct) => {
    setInventory((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const deleteProduct = (id) => {
    setInventory((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAllInventory = useCallback(() => {
    setInventory([]);
    console.log('Inventário completamente limpo.');
  }, []);

  // Ações do Carrinho
  const addToCart = (productToAdd) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productToAdd.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === productToAdd.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...productToAdd, quantity: 1 }];
      }
    });
  };

  const updateCartItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  // Ações de Taxas Fixas
  const addFixedTax = (tax) => {
    setFixedTaxes((prev) => [...prev, tax]);
  };

  const updateFixedTax = (updatedTax) => {
    setFixedTaxes((prev) =>
      prev.map((t) => (t.id === updatedTax.id ? updatedTax : t))
    );
  };

  const deleteFixedTax = (id) => {
    setFixedTaxes((prev) => prev.filter((t) => t.id !== id));
  };

  // Ações de Transação
  const clearTransactions = useCallback(() => {
    setTransactions([]);
    saveToStorage(STORAGE_KEY_TRANSACTIONS, []);
  }, []);

  const checkout = (finalTotal, subtotal, appliedDiscountValue, currentDiscount, appliedFixedTaxes, totalTaxAmount) => {
    console.log('Checkout iniciado...');
    console.log('Carrinho antes da dedução:', cart);
    console.log('Inventário antes da dedução:', inventory);

    // 1. Deduzir estoque do inventário
    setInventory((prevInventory) => {
      const updatedInventory = prevInventory.map((invItem) => {
        const cartItem = cart.find((cItem) => cItem.id === invItem.id);
        if (cartItem) {
          return { ...invItem, stock: invItem.stock - cartItem.quantity };
        }
        return invItem;
      });
      console.log('Inventário após dedução:', updatedInventory);
      return updatedInventory;
    });

    // 2. Registrar transação
    const newTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        totalItemPrice: item.price * item.quantity
      })),
      subtotal: subtotal,
      discount: currentDiscount,
      appliedDiscountValue: appliedDiscountValue,
      totalTaxAmount: totalTaxAmount,
      appliedFixedTaxes: appliedFixedTaxes.map(tax => ({ ...tax })),
      total: finalTotal,
    };
    console.log('Nova transação criada:', newTransaction);
    setTransactions((prev) => {
      const updatedTransactions = [...prev, newTransaction];
      console.log('Transações atualizadas:', updatedTransactions);
      return updatedTransactions;
    });

    // 3. Limpar o carrinho e resetar o desconto
    setCart([]);
    setDiscount({ value: 0, type: 'value' });
    console.log('Carrinho limpo e desconto resetado.');
  };

  if (loadingInitialData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        cart,
        transactions,
        fixedTaxes,
        discount,
        setDiscount,
        addProduct,
        updateProduct,
        deleteProduct,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        checkout,
        clearTransactions,
        addFixedTax,
        updateFixedTax,
        deleteFixedTax,
        clearAllInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};


// --- Componente Principal (App) para React Native ---
export default function App() {
  // Removido useSafeAreaInsets daqui. React Navigation Bottom Tabs já cuida dos insets.

  return (
    <InventoryProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Inventário') {
                iconName = '📦'; // Emoji para Inventário
              } else if (route.name === 'Carrinho') {
                iconName = '🛒'; // Emoji para Carrinho
              } else if (route.name === 'Transações') {
                iconName = '📈'; // Emoji para Transações
              }
              return <Text style={{ fontSize: size, color: color }}>{iconName}</Text>;
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              backgroundColor: Colors.background,
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0', // gray-200
              height: 120, // Altura padrão para a tab bar, será ajustada pelo React Navigation para safe areas
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginBottom: 5,
            },
            headerShown: false, // Oculta o cabeçalho padrão da navegação
          })}
        >
          <Tab.Screen name="Inventário" component={InventoryScreen} />
          <Tab.Screen name="Carrinho" component={CartScreen} />
          <Tab.Screen name="Transações" component={TransactionsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </InventoryProvider>
  );
}

const styles = StyleSheet.create({
  // Estilo principal do contêiner da área segura, para envolver todo o conteúdo da tela
  safeAreaContainer: {
    flex: 1,
    backgroundColor: Colors.background, // Garante que a área fora do conteúdo também tenha a cor de fundo
  },
  // O conteúdo real da tela, com padding
  screenContent: {
    flex: 1,
    paddingHorizontal: 16, // Padding horizontal para o conteúdo
    // Removido paddingBottom aqui, pois a tab bar já terá seu próprio padding
    backgroundColor: Colors.background,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.text,
    marginBottom: 20,
    marginTop: 10,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: Colors.text,
  },

  // Estilos do ProductItem
  productItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 8,
    borderLeftColor: Colors.accent,
  },
  productItemDetails: {
    flex: 1,
  },
  productItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  productItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  productItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Estilos de Modais (geral)
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.text,
    marginBottom: 20,
  },
  modalSubTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.text,
    marginBottom: 10,
    marginTop: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },

  // Estilos do Campo de Busca e Sugestões
  searchContainer: {
    marginBottom: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 55, // Ajusta a posição abaixo do TextInput
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 1000, // Garante que fique acima de outros elementos
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  suggestionText: {
    fontSize: 16,
    color: Colors.text,
  },

  // Estilos do CartItem
  cartItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 8,
    borderLeftColor: Colors.primary,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cartItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Estilos do Carrinho - Resumo
  cartSummaryContainer: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    width: '100%',
    alignSelf: 'center', // Centraliza o contêiner
  },
  cartSummaryText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  cartFinalTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taxesSelectionContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
  },
  taxButtonsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  taxButton: {
    ...commonStyles.buttonBase,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 4,
  },
  taxButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Estilos da Transações
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 8,
    borderLeftColor: Colors.accent,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDetail: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  listItem: {
    marginLeft: 20,
    marginBottom: 2,
  },
  listItemText: {
    fontSize: 13,
    color: Colors.text,
  },

  // Estilos de Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: Colors.text,
  },

  // Estilos da lista de Taxas Fixas no modal
  fixedTaxListContainer: {
    width: '100%',
    maxHeight: 150,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F9FAFB', // light gray background
  },
  fixedTaxItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fixedTaxItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  fixedTaxItemActions: {
    flexDirection: 'row',
  },
  
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  }
});
