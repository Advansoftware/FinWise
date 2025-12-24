import '../constants/api_constants.dart';
import '../models/models.dart';
import 'api_service.dart';

/// Resultado do scan de recibo
class ReceiptScanResult {
  final bool success;
  final String? error;
  final String? establishment;
  final String? date;
  final List<ReceiptItem> items;
  final double totalAmount;
  final String? suggestedCategory;

  ReceiptScanResult({
    required this.success,
    this.error,
    this.establishment,
    this.date,
    this.items = const [],
    this.totalAmount = 0,
    this.suggestedCategory,
  });

  factory ReceiptScanResult.fromJson(Map<String, dynamic> json) {
    return ReceiptScanResult(
      success: json['success'] ?? false,
      error: json['error'],
      establishment: json['establishment'],
      date: json['date'],
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => ReceiptItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      suggestedCategory: json['suggestedCategory'],
    );
  }
}

/// Item de um recibo escaneado
class ReceiptItem {
  final String item;
  final double amount;
  final int quantity;
  final String category;

  ReceiptItem({
    required this.item,
    required this.amount,
    this.quantity = 1,
    this.category = 'Supermercado',
  });

  factory ReceiptItem.fromJson(Map<String, dynamic> json) {
    return ReceiptItem(
      item: json['item'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      category: json['category'] ?? 'Supermercado',
    );
  }
}

/// Service para escanear recibos via QR code e IA
class ReceiptService {
  final ApiService _api = ApiService();

  /// Escaneia NFCe via URL do QR Code (scraping)
  Future<ApiResult<ReceiptScanResult>> scanNFCe(String url) async {
    return _api.post<ReceiptScanResult>(
      '/receipts/scan-nfce',
      {'url': url},
      (data) => ReceiptScanResult.fromJson(data),
    );
  }

  /// Escaneia recibo via imagem usando IA (custa 10 créditos)
  Future<ApiResult<ReceiptScanResult>> scanWithAI(String base64Image) async {
    return _api.post<ReceiptScanResult>(
      '/receipts/scan-ai',
      {'image': base64Image},
      (data) => ReceiptScanResult.fromJson(data),
    );
  }
}
