from flask import Flask, jsonify, request
from flask_mysqldb import MySQL
from flask_cors import CORS
import requests
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# MySQL configurations
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'password'
app.config['MYSQL_DB'] = 'database_kamu'

mysql = MySQL(app)

# Endpoint untuk mendapatkan semua produk
@app.route('/produk', methods=['GET'])
def get_produk():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT id, nama_produk, harga, berat, stok FROM produk')
        results = cursor.fetchall()
        produk_list = [{'id': row[0], 'nama_produk': row[1], 'harga': float(row[2]), 'berat': float(row[3]), 'stok': row[4]} for row in results]
        cursor.close()
        return jsonify(produk_list)
    except Exception as e:
        logging.error(f'Error retrieving products: {e}')
        return jsonify({'message': 'Gagal mengambil data produk'}), 500

# Endpoint untuk menambah produk
@app.route('/produk', methods=['POST'])
def add_produk():
    data = request.json
    # Validasi input
    if not all(key in data for key in ('nama_produk', 'harga', 'berat', 'stok')):
        return jsonify({'message': 'Data tidak lengkap'}), 400
    try:
        cursor = mysql.connection.cursor()
        cursor.execute(
            'INSERT INTO produk (nama_produk, harga, berat, stok) VALUES (%s, %s, %s, %s)',
            (data['nama_produk'], data['harga'], data['berat'], data['stok'])
        )
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Produk berhasil ditambahkan'}), 201
    except Exception as e:
        logging.error(f'Error adding product: {e}')
        return jsonify({'message': 'Gagal menambah produk'}), 500

# Endpoint untuk memperbarui produk
@app.route('/produk/<int:id>', methods=['PUT'])
def update_produk(id):
    data = request.json
    # Validasi input
    if not all(key in data for key in ('nama_produk', 'harga', 'berat', 'stok')):
        return jsonify({'message': 'Data tidak lengkap'}), 400
    try:
        cursor = mysql.connection.cursor()
        cursor.execute(
            'UPDATE produk SET nama_produk = %s, harga = %s, berat = %s, stok = %s WHERE id = %s',
            (data['nama_produk'], data['harga'], data['berat'], data['stok'], id)
        )
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Produk berhasil diperbarui'}), 200
    except Exception as e:
        logging.error(f'Error updating product: {e}')
        return jsonify({'message': 'Gagal memperbarui produk'}), 500

# Endpoint untuk mendapatkan ID kota berdasarkan nama kota
@app.route('/get-city-id', methods=['POST'])
def get_city_id():
    data = request.json
    city_name = data.get('city_name')
    if not city_name:
        return jsonify({'message': 'Nama kota tidak diberikan'}), 400

    api_key = 'RAJAONGKIR_API_KEY'
    url = 'https://api.rajaongkir.com/starter/city'

    headers = {
        'key': api_key,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    try:
        response = requests.get(url, headers=headers)
        logging.debug(f"RajaOngkir City Response: {response.text}")

        if response.status_code == 200:
            cities = response.json().get('rajaongkir', {}).get('results', [])
            for city in cities:
                if city['city_name'].lower() == city_name.lower():
                    return jsonify({'city_id': city['city_id']})
            return jsonify({'message': 'Kota tidak ditemukan'}), 404
        else:
            return jsonify({'message': 'Gagal mengambil data kota'}), response.status_code
    except Exception as e:
        logging.error(f'Error retrieving city ID: {e}')
        return jsonify({'message': 'Terjadi kesalahan saat menghubungi RajaOngkir'}), 500

# Endpoint untuk menambah pesanan dan menghitung ongkos kirim
@app.route('/pesanan', methods=['POST'])
def add_pesanan():
    data = request.json
    # Validasi input
    required_fields = ['nama_pembeli', 'id_produk', 'jumlah', 'origin', 'destination', 'courier']
    if not all(key in data for key in required_fields):
        return jsonify({'message': 'Data tidak lengkap'}), 400

    nama_pembeli = data['nama_pembeli']
    id_produk = data['id_produk']
    jumlah = data['jumlah']
    origin = data['origin']
    destination = data['destination']
    courier = data['courier']

    try:
        cursor = mysql.connection.cursor()
        # Mendapatkan berat produk dari database
        cursor.execute('SELECT berat FROM produk WHERE id = %s', (id_produk,))
        product = cursor.fetchone()
        if not product:
            return jsonify({'message': 'Produk tidak ditemukan'}), 404
        berat_per_item = product[0]
        total_weight = berat_per_item * jumlah

        # Menghitung ongkos kirim menggunakan RajaOngkir
        api_key = 'RAJAONGKIR_API_KEY'
        url = 'https://api.rajaongkir.com/starter/cost'

        headers = {
            'key': api_key,
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        params = {
            'origin': origin,
            'destination': destination,
            'weight': total_weight,
            'courier': courier
        }

        response = requests.post(url, headers=headers, data=params)
        logging.debug(f"RajaOngkir Shipping Cost Response: {response.text}")

        if response.status_code == 200:
            cost_data = response.json().get("rajaongkir", {}).get("results", [])[0].get("costs", [])[0].get("cost", [])[0]
            shipping_cost = cost_data["value"]

            # Menyimpan detail pengiriman ke tabel pengiriman
            cursor.execute(
                'INSERT INTO pengiriman (origin, destination, weight, courier, cost) VALUES (%s, %s, %s, %s, %s)',
                (origin, destination, total_weight, courier, shipping_cost)
            )
            pengiriman_id = cursor.lastrowid

            # Menyimpan pesanan ke tabel pesanan
            cursor.execute(
                'INSERT INTO pesanan (nama_pembeli, id_produk, jumlah, origin, destination, weight, courier, shipping_cost, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)',
                (nama_pembeli, id_produk, jumlah, origin, destination, total_weight, courier, shipping_cost, datetime.now())
            )
            pesanan_id = cursor.lastrowid

            mysql.connection.commit()
            cursor.close()

            return jsonify({
                'message': 'Pesanan berhasil ditambahkan',
                'pesanan_id': pesanan_id,
                'pengiriman_id': pengiriman_id,
                'shipping_cost': shipping_cost
            }), 201
        else:
            error_message = response.json().get("rajaongkir", {}).get("status", {}).get("description", "Gagal menghitung ongkos kirim")
            logging.error(f"API Error: {error_message}")
            return jsonify({'message': error_message}), response.status_code
    except Exception as e:
        mysql.connection.rollback()
        logging.error(f'Error adding order: {e}')
        return jsonify({'message': 'Gagal menambah pesanan'}), 500

# Endpoint untuk mendapatkan semua pesanan
@app.route('/pesanan', methods=['GET'])
def get_pesanan():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM pesanan')
        results = cursor.fetchall()
        pesanan_list = [{
            'id': row[0],
            'nama_pembeli': row[1],
            'id_produk': row[2],
            'jumlah': row[3],
            'origin': row[4],
            'destination': row[5],
            'weight': row[6],
            'courier': row[7],
            'shipping_cost': row[8],
            'created_at': row[9]
        } for row in results]
        cursor.close()
        return jsonify(pesanan_list)
    except Exception as e:
        logging.error(f'Error retrieving orders: {e}')
        return jsonify({'message': 'Gagal mengambil data pesanan'}), 500

# Endpoint untuk mendapatkan semua data pengiriman
@app.route('/pengiriman', methods=['GET'])
def get_pengiriman():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM pengiriman')
        results = cursor.fetchall()
        pengiriman_list = [{
            'id': row[0],
            'origin': row[1],
            'destination': row[2],
            'weight': row[3],
            'courier': row[4],
            'cost': row[5]
        } for row in results]
        cursor.close()
        return jsonify(pengiriman_list)
    except Exception as e:
        logging.error(f'Error retrieving shipping data: {e}')
        return jsonify({'message': 'Gagal mengambil data pengiriman'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port='port_kamu')