import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";

const TambahProduk = () => {
  const [namaProduk, setNamaProduk] = useState("");
  const [harga, setHarga] = useState("");
  const [stok, setStok] = useState("");
  const [berat, setBerat] = useState("");
  const [produkList, setProdukList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false); // State untuk modal

  useEffect(() => {
    fetchProduk();
  }, []);

  const fetchProduk = async () => {
    try {
      const response = await axios.get("http://<YOUR_BACKEND_URL>/produk");
      console.log("Data Produk:", response.data);
      setProdukList(response.data);
    } catch (error) {
      console.error("Error fetching produk:", error);
      Alert.alert("Error", "Gagal mengambil data produk.");
    }
  };

  const tambahAtauUpdateProduk = async () => {
    if (!namaProduk || !harga || !stok || !berat) {
      Alert.alert("Peringatan", "Semua field harus diisi.");
      return;
    }

    const produkData = {
      nama_produk: namaProduk,
      harga: parseFloat(harga),
      stok: parseInt(stok),
      berat: parseFloat(berat),
      weight: parseInt(berat),
    };

    try {
      if (selectedId) {
        await axios.put(
          `http://<YOUR_BACKEND_URL>/produk/${selectedId}`,
          produkData
        );
        Alert.alert("Sukses", "Produk berhasil diperbarui!");
      } else {
        await axios.post("http://<YOUR_BACKEND_URL>/produk", produkData);
        Alert.alert("Sukses", "Produk berhasil ditambahkan!");
      }
      resetForm();
      fetchProduk();
      setModalVisible(false); // Menutup modal setelah sukses
    } catch (error) {
      console.error("Error adding/updating produk:", error);
      const errorMessage = error.response
        ? error.response.data.message
        : "Gagal menambahkan atau memperbarui produk.";
      Alert.alert("Error", errorMessage);
    }
  };

  const resetForm = () => {
    setNamaProduk("");
    setHarga("");
    setStok("");
    setBerat("");
    setSelectedId(null);
  };

  const handleUpdate = (item) => {
    setSelectedId(item.id);
    setNamaProduk(item.nama_produk || "");
    setHarga(item.harga !== undefined ? item.harga.toString() : "");
    setStok(item.stok !== undefined ? item.stok.toString() : "");
    setBerat(item.berat !== undefined ? item.berat.toString() : "");
    setModalVisible(true); // Menampilkan modal saat edit
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.nama_produk}</Text>
      <Text style={styles.itemText}>
        {item.harga ? item.harga.toFixed(2) : "N/A"}
      </Text>
      <Text style={styles.itemText}>
        {item.stok !== undefined ? item.stok : "N/A"}
      </Text>
      <Text style={styles.itemText}>
        {item.berat ? item.berat.toFixed(2) : "N/A"} kg
      </Text>
      <Button title="Edit" onPress={() => handleUpdate(item)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.navbarText}>Selamat Datang</Text>
        <TouchableOpacity
          style={styles.buttonTambah}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Tambah Produk</Text>
        </TouchableOpacity>
      </View>

      {/* Modal untuk tambah produk */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Nama Produk"
              value={namaProduk}
              onChangeText={setNamaProduk}
            />
            <TextInput
              style={styles.input}
              placeholder="Harga"
              value={harga}
              keyboardType="numeric"
              onChangeText={setHarga}
            />
            <TextInput
              style={styles.input}
              placeholder="Stok"
              value={stok}
              keyboardType="numeric"
              onChangeText={setStok}
            />
            <TextInput
              style={styles.input}
              placeholder="Berat (kg)"
              value={berat}
              keyboardType="numeric"
              onChangeText={setBerat}
            />
            <Button
              title={selectedId ? "Perbarui Produk" : "Tambah Produk"}
              onPress={tambahAtauUpdateProduk}
            />
            <Button
              title="Batal"
              onPress={() => setModalVisible(false)}
              color="#f00"
            />
          </View>
        </View>
      </Modal>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Nama Produk</Text>
          <Text style={styles.headerText}>Harga</Text>
          <Text style={styles.headerText}>Stok</Text>
          <Text style={styles.headerText}>Berat</Text>
          <Text style={styles.headerText}>Aksi</Text>
        </View>
        <FlatList
          data={produkList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          style={styles.list}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#6200EE",
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 4,
  },
  navbarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonTambah: {
    backgroundColor: "#03DAC5",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Background gelap untuk modal
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  tableContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 5,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    padding: 10,
  },
  headerText: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    textAlign: "center",
  },
  list: {
    marginTop: 10,
  },
});

export default TambahProduk;
