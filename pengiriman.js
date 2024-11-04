import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Button, Alert, ActivityIndicator, TextInput, ScrollView, Modal, TouchableOpacity } from 'react-native';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [buyerName, setBuyerName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [origin] = useState({ city_id: '1', city_name: 'Bandung' });
  const [destination, setDestination] = useState(null);
  const [courier, setCourier] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const productResponse = await fetch('http://<YOUR_BACKEND_URL>/produk');
      const productData = await productResponse.json();
      setProducts(productData);

      const cityResponse = await fetch('https://api.rajaongkir.com/starter/city', {
        method: 'GET',
        headers: {
          key: 'RAJAONGKIR_API_KEY', 
        },
      });
      const cityData = await cityResponse.json();
      setCities(cityData.rajaongkir.results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = () => {
    if (!selectedProduct || !buyerName || !quantity || !destination || !courier) {
      Alert.alert('Error', 'Silakan lengkapi semua informasi pesanan!');
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      Alert.alert('Error', 'Jumlah harus lebih dari 0!');
      return;
    }

    fetch('http://<YOUR_BACKEND_URL>/pesanan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama_pembeli: buyerName,
        id_produk: selectedProduct.id,
        jumlah: qty,
        origin: origin.city_id,
        destination: destination?.city_id,
        courier,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => { throw new Error(data.message || 'Gagal membuat pesanan'); });
        }
        return response.json();
      })
      .then((data) => {
        const totalPrice = selectedProduct.harga * qty;
        Alert.alert('Pesanan berhasil dibuat!', 
          `Nama Pembeli: ${buyerName}\n` +
          `Produk: ${selectedProduct.nama_produk}\n` +
          `Tujuan: ${destination.city_name} (ID: ${destination.city_id})\n` +
          `Harga: Rp${totalPrice}\n` +
          `Ongkos Kirim: Rp${data.shipping_cost}`
        );
        resetForm();
      })
      .catch((error) => Alert.alert('Error', error.message));
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setBuyerName('');
    setQuantity('');
    setDestination(null);
    setCourier('');
  };

  const handleSelectDestination = (city) => {
    setDestination(city);
    setModalVisible(false);
  };

  const openCityModal = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    resetForm(); 
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcomeText}>Selamat Datang </Text>
      <Text style={styles.title}>Daftar Produk</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.productsContainer}>
          {products.length > 0 ? (
            products.map((item) => (
              <View style={styles.productContainer} key={item.id}>
                <TouchableOpacity
                  style={styles.productButton}
                  onPress={() => setSelectedProduct(item)}
                >
                  <Text style={styles.productName}>{item.nama_produk}</Text>
                  <Text style={styles.productPrice}>Harga: Rp{item.harga}</Text>
                  <Text style={styles.productStock}>Stok: {item.stok}</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text>Tidak ada produk yang tersedia.</Text>
          )}
        </View>
      )}

      {selectedProduct && (
        <View style={styles.orderContainer}>
          <Text style={styles.orderTitle}>Pemesanan: {selectedProduct.nama_produk}</Text>
          <TextInput
            placeholder="Nama Pembeli"
            value={buyerName}
            onChangeText={setBuyerName}
            style={styles.input}
          />
          <TextInput
            placeholder="Jumlah"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <Text style={styles.sectionTitle}>Alamat Toko</Text>
          <Text style={styles.addressText}>{`Asal: ${origin.city_name} (ID: ${origin.city_id})`}</Text>

          <Text style={styles.sectionTitle}>Tujuan</Text>
          {destination ? (
            <TouchableOpacity onPress={openCityModal} style={styles.selectedButton}>
              <Text style={styles.buttonText}>{`Tujuan: ${destination.city_name} (ID: ${destination.city_id})`}</Text>
            </TouchableOpacity>
          ) : (
            <Button title="Pilih Kota Tujuan" onPress={openCityModal} color="#007bff" style={styles.smallButton} />
          )}
          
          <TextInput
            placeholder="Kurir"
            value={courier}
            onChangeText={setCourier}
            style={styles.input}
          />
          <View style={styles.buttonContainer}>
            <Button title="Pesan" onPress={handleOrder} color="green"/>
            <Button title="Batal" onPress={handleCancel} color="blue" />
          
          </View>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Pilih Kota</Text>
            <ScrollView style={styles.cityList}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city.city_id}
                  style={styles.cityButton}
                  onPress={() => handleSelectDestination(city)}
                >
                  <Text>{`${city.city_name} (ID: ${city.city_id})`}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Tutup" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  welcomeText: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '	#	#228B22',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',

  },
  productContainer: {
    width: '48%',
    marginBottom: 10,
  },
  productButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 5,
  },
  productName: {
    color: '#fff',
    fontSize: 16,
  },
  productPrice: {
    color: '#fff',
    fontSize: 14,
  },
  productStock: {
    color: '#fff',
    fontSize: 14,
  },
  orderContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    elevation: 2, // Menambahkan bayangan
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#fff', // Warna latar belakang putih
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  addressText: {
    fontSize: 14,
    marginVertical: 5,
    color: '#333',
  },
  selectedButton: {
    backgroundColor: '#007bff',
    padding: 5,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  smallButton: {
    width: '50%', // Mengubah ukuran button untuk kota tujuan
  },
  buttonText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cityList: {
    maxHeight: 200,
    width: '100%',
  },
  cityButton: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});
