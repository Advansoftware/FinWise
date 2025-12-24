import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/receipt_service.dart';
import '../../core/utils/format_utils.dart';

/// Tela de scanner de nota fiscal com QR code e câmera
class ReceiptScannerScreen extends StatefulWidget {
  const ReceiptScannerScreen({super.key});

  static Future<ReceiptScanResult?> show(BuildContext context) async {
    return Navigator.push<ReceiptScanResult>(
      context,
      MaterialPageRoute(
        builder: (context) => const ReceiptScannerScreen(),
        fullscreenDialog: true,
      ),
    );
  }

  @override
  State<ReceiptScannerScreen> createState() => _ReceiptScannerScreenState();
}

class _ReceiptScannerScreenState extends State<ReceiptScannerScreen> {
  final ReceiptService _receiptService = ReceiptService();
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );
  
  bool _isProcessing = false;
  bool _hasPermission = false;
  String? _error;
  bool _qrDetected = false;

  @override
  void initState() {
    super.initState();
    _checkPermission();
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _checkPermission() async {
    final status = await Permission.camera.request();
    setState(() {
      _hasPermission = status.isGranted;
      if (!status.isGranted) {
        _error = 'Permissão de câmera negada';
      }
    });
  }

  Future<void> _onQRCodeDetected(BarcodeCapture capture) async {
    if (_isProcessing || _qrDetected) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final String? url = barcode.rawValue;
      if (url != null && _isNFCeUrl(url)) {
        setState(() {
          _qrDetected = true;
          _isProcessing = true;
        });
        
        await _processNFCeUrl(url);
        break;
      }
    }
  }

  bool _isNFCeUrl(String url) {
    final patterns = [
      RegExp(r'nfce', caseSensitive: false),
      RegExp(r'qrcode', caseSensitive: false),
      RegExp(r'sefaz', caseSensitive: false),
      RegExp(r'fazenda', caseSensitive: false),
      RegExp(r'portalsped', caseSensitive: false),
    ];
    return patterns.any((pattern) => pattern.hasMatch(url));
  }

  Future<void> _processNFCeUrl(String url) async {
    try {
      final result = await _receiptService.scanNFCe(url);
      
      if (result.isSuccess && result.data != null) {
        if (mounted) {
          Navigator.pop(context, result.data);
        }
      } else {
        setState(() {
          _error = result.error ?? 'Erro ao processar nota fiscal';
          _isProcessing = false;
          _qrDetected = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Erro: $e';
        _isProcessing = false;
        _qrDetected = false;
      });
    }
  }

  Future<void> _captureAndAnalyze() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1200,
      maxHeight: 1600,
      imageQuality: 85,
    );

    if (image == null) return;

    setState(() {
      _isProcessing = true;
      _error = null;
    });

    try {
      final bytes = await File(image.path).readAsBytes();
      final base64Image = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      
      final result = await _receiptService.scanWithAI(base64Image);
      
      if (result.isSuccess && result.data != null) {
        if (mounted) {
          Navigator.pop(context, result.data);
        }
      } else {
        setState(() {
          _error = result.error ?? 'Erro ao analisar imagem';
          _isProcessing = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Erro: $e';
        _isProcessing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Escanear Nota'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          StatefulBuilder(
            builder: (context, setFlashState) {
              return IconButton(
                icon: Icon(
                  _scannerController.torchEnabled ? Icons.flash_on : Icons.flash_off,
                ),
                onPressed: () async {
                  await _scannerController.toggleTorch();
                  setFlashState(() {});
                },
              );
            },
          ),
        ],
      ),
      body: !_hasPermission
          ? _buildPermissionDenied()
          : _isProcessing
              ? _buildProcessing()
              : _buildScanner(),
    );
  }

  Widget _buildPermissionDenied() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.camera_alt_outlined,
              size: 64,
              color: Colors.white.withAlpha(128),
            ),
            const SizedBox(height: 16),
            const Text(
              'Permissão de câmera necessária',
              style: TextStyle(color: Colors.white, fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _checkPermission,
              child: const Text('Permitir acesso'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProcessing() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppTheme.primary),
          const SizedBox(height: 24),
          Text(
            _qrDetected ? 'Processando nota fiscal...' : 'Analisando imagem...',
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
          if (_qrDetected)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Isso pode levar alguns segundos',
                style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 14),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildScanner() {
    return Stack(
      children: [
        // Camera preview
        MobileScanner(
          controller: _scannerController,
          onDetect: _onQRCodeDetected,
        ),
        
        // Overlay with scanning area
        Container(
          decoration: BoxDecoration(
            color: Colors.black.withAlpha(128),
          ),
          child: Stack(
            children: [
              // Transparent center area
              Center(
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    border: Border.all(color: AppTheme.primary, width: 3),
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Instructions
        Positioned(
          left: 0,
          right: 0,
          bottom: 180,
          child: Column(
            children: [
              const Icon(Icons.qr_code_scanner, size: 32, color: AppTheme.primary),
              const SizedBox(height: 12),
              const Text(
                'Aponte para o QR Code da nota',
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Text(
                'Ou tire uma foto para análise com IA',
                style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 14),
              ),
            ],
          ),
        ),
        
        // Error message
        if (_error != null)
          Positioned(
            left: 16,
            right: 16,
            bottom: 140,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.error.withAlpha(200),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 18),
                    onPressed: () => setState(() => _error = null),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
          ),
        
        // Bottom action buttons
        Positioned(
          left: 0,
          right: 0,
          bottom: 40,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Photo capture button
              GestureDetector(
                onTap: _captureAndAnalyze,
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                  ),
                  child: const Icon(Icons.camera_alt, color: Colors.white, size: 32),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
